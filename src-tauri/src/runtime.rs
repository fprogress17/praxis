use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    io::{Read, Write},
    net::TcpStream,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{Arc, Mutex},
    thread::sleep,
    time::Duration,
};

const DEFAULT_BACKEND_URL: &str = "http://127.0.0.1:4001/health";
const DEFAULT_FRONTEND_URL: &str = "http://127.0.0.1:3007/";

#[derive(Default)]
pub struct ManagedRuntime {
    backend: Option<Child>,
    frontend: Option<Child>,
}

pub type SharedRuntime = Arc<Mutex<ManagedRuntime>>;

#[derive(Clone)]
struct ManagedRuntimeConfig {
    workdir: PathBuf,
    env_file: PathBuf,
    backend_health_url: String,
    frontend_health_url: String,
    backend_log_file: PathBuf,
    frontend_log_file: PathBuf,
    backend_program: String,
    backend_args: Vec<String>,
    frontend_program: String,
    frontend_args: Vec<String>,
}

impl ManagedRuntime {
    pub fn shared() -> SharedRuntime {
        Arc::new(Mutex::new(Self::default()))
    }

    pub fn maybe_start(runtime: &SharedRuntime) -> Result<(), String> {
        if std::env::var("PRAXIS_DESKTOP_MANAGED_RUNTIME").ok().as_deref() != Some("1") {
            return Ok(());
        }

        let config = ManagedRuntimeConfig::from_env()?;
        let inherited_env = load_env_file(&config.env_file);
        let mut state = runtime
            .lock()
            .map_err(|_| "Managed runtime lock poisoned.".to_string())?;

        if !http_ok(&config.backend_health_url) {
            state.backend = Some(spawn_process(
                &config.workdir,
                &config.backend_log_file,
                &config.backend_program,
                &config.backend_args,
                &inherited_env,
                &[
                    ("PRAXIS_BACKEND_HOST", "127.0.0.1"),
                    ("PRAXIS_BACKEND_PORT", "4001"),
                    ("PRAXIS_BACKEND_CLIENT_HOST", "127.0.0.1"),
                ],
            )?);
            wait_for_http_ok(&config.backend_health_url, "backend")?;
        }

        if !http_ok(&config.frontend_health_url) {
            state.frontend = Some(spawn_process(
                &config.workdir,
                &config.frontend_log_file,
                &config.frontend_program,
                &config.frontend_args,
                &inherited_env,
                &[
                    ("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:4001"),
                    ("PRAXIS_API_BASE_URL", "http://127.0.0.1:4001"),
                ],
            )?);
            wait_for_http_ok(&config.frontend_health_url, "frontend")?;
        }

        Ok(())
    }

    pub fn shutdown(&mut self) {
        stop_child(&mut self.frontend);
        stop_child(&mut self.backend);
    }
}

impl ManagedRuntimeConfig {
    fn from_env() -> Result<Self, String> {
        let workdir = std::env::var("PRAXIS_DESKTOP_WORKDIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
            });
        let runtime_dir = std::env::var("PRAXIS_RUNTIME_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| workdir.join(".runtime"));

        fs::create_dir_all(&runtime_dir).map_err(|error| error.to_string())?;

        Ok(Self {
            env_file: workdir.join(".env.local"),
            backend_health_url: std::env::var("PRAXIS_DESKTOP_BACKEND_HEALTH_URL")
                .unwrap_or_else(|_| DEFAULT_BACKEND_URL.to_string()),
            frontend_health_url: std::env::var("PRAXIS_DESKTOP_FRONTEND_HEALTH_URL")
                .unwrap_or_else(|_| DEFAULT_FRONTEND_URL.to_string()),
            backend_log_file: runtime_dir.join("praxis-backend.native.log"),
            frontend_log_file: runtime_dir.join("praxis-frontend.native.log"),
            backend_program: std::env::var("PRAXIS_DESKTOP_BACKEND_PROGRAM")
                .unwrap_or_else(|_| "node".to_string()),
            backend_args: split_args(
                &std::env::var("PRAXIS_DESKTOP_BACKEND_ARGS").unwrap_or_else(|_| {
                    "--experimental-strip-types|--loader|./backend/alias-loader.mjs|backend/server.ts"
                        .to_string()
                }),
            ),
            frontend_program: std::env::var("PRAXIS_DESKTOP_FRONTEND_PROGRAM")
                .unwrap_or_else(|_| "npx".to_string()),
            frontend_args: split_args(
                &std::env::var("PRAXIS_DESKTOP_FRONTEND_ARGS").unwrap_or_else(|_| {
                    "next|start|--hostname|127.0.0.1|--port|3007".to_string()
                }),
            ),
            workdir,
        })
    }
}

fn split_args(raw: &str) -> Vec<String> {
    raw.split('|')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
        .collect()
}

fn spawn_process(
    workdir: &Path,
    log_file: &Path,
    program: &str,
    args: &[String],
    inherited_env: &HashMap<String, String>,
    overrides: &[(&str, &str)],
) -> Result<Child, String> {
    let log = OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(log_file)
        .map_err(|error| error.to_string())?;
    let log_clone = log.try_clone().map_err(|error| error.to_string())?;

    let mut command = Command::new(program);
    command
        .current_dir(workdir)
        .args(args)
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(log_clone));

    for (key, value) in inherited_env {
        command.env(key, value);
    }
    for (key, value) in overrides {
        command.env(key, value);
    }

    command.spawn().map_err(|error| {
        format!(
            "Could not start runtime process `{}` with args {:?}: {}",
            program, args, error
        )
    })
}

fn stop_child(child: &mut Option<Child>) {
    let Some(process) = child.as_mut() else {
        return;
    };

    let _ = process.kill();
    let _ = process.wait();
    *child = None;
}

fn wait_for_http_ok(url: &str, name: &str) -> Result<(), String> {
    for _ in 0..60 {
        if http_ok(url) {
            return Ok(());
        }
        sleep(Duration::from_millis(200));
    }

    Err(format!("Managed desktop runtime {} did not become healthy: {}", name, url))
}

fn http_ok(url: &str) -> bool {
    let Some((host, port, path)) = parse_http_url(url) else {
        return false;
    };

    let Ok(mut stream) = TcpStream::connect((host.as_str(), port)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(1)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(1)));

    let request = format!(
        "GET {} HTTP/1.1\r\nHost: {}:{}\r\nConnection: close\r\n\r\n",
        path, host, port
    );
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }

    let mut response = String::new();
    if stream.read_to_string(&mut response).is_err() {
        return false;
    }

    response.starts_with("HTTP/1.1 200") || response.starts_with("HTTP/1.0 200")
}

fn parse_http_url(url: &str) -> Option<(String, u16, String)> {
    let raw = url.strip_prefix("http://")?;
    let (host_port, path) = match raw.split_once('/') {
        Some((host_port, path)) => (host_port, format!("/{}", path)),
        None => (raw, "/".to_string()),
    };

    let (host, port) = host_port.rsplit_once(':')?;
    let port = port.parse().ok()?;
    Some((host.to_string(), port, path))
}

fn load_env_file(path: &Path) -> HashMap<String, String> {
    let Ok(text) = fs::read_to_string(path) else {
        return HashMap::new();
    };

    let mut values = HashMap::new();
    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        let trimmed = value.trim().trim_matches('"').trim_matches('\'');
        values.insert(key.trim().to_string(), trimmed.to_string());
    }
    values
}

#[cfg(test)]
mod tests {
    use super::{parse_http_url, split_args};

    #[test]
    fn parses_http_url_with_path() {
        let parsed = parse_http_url("http://127.0.0.1:3007/api/bootstrap").unwrap();
        assert_eq!(parsed.0, "127.0.0.1");
        assert_eq!(parsed.1, 3007);
        assert_eq!(parsed.2, "/api/bootstrap");
    }

    #[test]
    fn splits_pipe_args() {
        assert_eq!(
            split_args("next|start|--hostname|127.0.0.1|--port|3007"),
            vec!["next", "start", "--hostname", "127.0.0.1", "--port", "3007"]
        );
    }
}

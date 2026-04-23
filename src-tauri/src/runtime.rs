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
const DESKTOP_SETTINGS_FILE: &str = "desktop-settings.txt";

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
    frontend_health_url: String,
    backend_enabled: bool,
    backend_health_url: String,
    backend_log_file: PathBuf,
    frontend_log_file: PathBuf,
    backend_program: String,
    backend_args: Vec<String>,
    backend_env_overrides: Vec<(String, String)>,
    frontend_program: String,
    frontend_args: Vec<String>,
    frontend_env_overrides: Vec<(String, String)>,
}

impl ManagedRuntime {
    pub fn shared() -> SharedRuntime {
        Arc::new(Mutex::new(Self::default()))
    }

    pub fn maybe_start(runtime: &SharedRuntime) -> Result<(), String> {
        if !managed_runtime_enabled() {
            return Ok(());
        }

        let config = ManagedRuntimeConfig::from_env()?;
        let inherited_env = load_env_file(&config.env_file);
        let mut state = runtime
            .lock()
            .map_err(|_| "Managed runtime lock poisoned.".to_string())?;

        if config.backend_enabled && !http_ok(&config.backend_health_url) {
            state.backend = Some(spawn_process(
                &config.workdir,
                &config.backend_log_file,
                &config.backend_program,
                &config.backend_args,
                &inherited_env,
                &config.backend_env_overrides,
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
                &config.frontend_env_overrides,
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
        if cfg!(debug_assertions) {
            return Self::dev_from_env();
        }

        Self::release_from_bundle()
    }

    fn dev_from_env() -> Result<Self, String> {
        let workdir = std::env::var("PRAXIS_DESKTOP_WORKDIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| repo_root_dir());
        let runtime_dir = std::env::var("PRAXIS_RUNTIME_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| workdir.join(".runtime"));
        let settings_path = std::env::var("PRAXIS_DESKTOP_SETTINGS_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| runtime_dir.join(DESKTOP_SETTINGS_FILE));
        let share_on_local_network = read_share_on_local_network(&settings_path);
        let bind_host = if share_on_local_network {
            "0.0.0.0"
        } else {
            "127.0.0.1"
        };

        fs::create_dir_all(&runtime_dir).map_err(|error| error.to_string())?;

        Ok(Self {
            env_file: workdir.join(".env.local"),
            frontend_health_url: std::env::var("PRAXIS_DESKTOP_FRONTEND_HEALTH_URL")
                .unwrap_or_else(|_| DEFAULT_FRONTEND_URL.to_string()),
            backend_enabled: true,
            backend_health_url: std::env::var("PRAXIS_DESKTOP_BACKEND_HEALTH_URL")
                .unwrap_or_else(|_| DEFAULT_BACKEND_URL.to_string()),
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
            backend_env_overrides: vec![
                ("PRAXIS_BACKEND_HOST".to_string(), bind_host.to_string()),
                ("PRAXIS_BACKEND_PORT".to_string(), "4001".to_string()),
                (
                    "PRAXIS_BACKEND_CLIENT_HOST".to_string(),
                    "127.0.0.1".to_string(),
                ),
            ],
            frontend_program: std::env::var("PRAXIS_DESKTOP_FRONTEND_PROGRAM")
                .unwrap_or_else(|_| "npx".to_string()),
            frontend_args: split_args(
                &std::env::var("PRAXIS_DESKTOP_FRONTEND_ARGS").unwrap_or_else(|_| {
                    format!("next|start|--hostname|{}|--port|3007", bind_host)
                }),
            ),
            frontend_env_overrides: vec![
                (
                    "NEXT_PUBLIC_API_BASE_URL".to_string(),
                    "http://127.0.0.1:4001".to_string(),
                ),
                (
                    "PRAXIS_API_BASE_URL".to_string(),
                    "http://127.0.0.1:4001".to_string(),
                ),
                (
                    "PRAXIS_DESKTOP_SETTINGS_PATH".to_string(),
                    settings_path.to_string_lossy().to_string(),
                ),
            ],
            workdir,
        })
    }

    fn release_from_bundle() -> Result<Self, String> {
        let app_support_dir = app_support_dir()?;
        let runtime_dir = app_support_dir.join("runtime");
        let file_storage_root = app_support_dir.join("files");
        let settings_path = app_support_dir.join(DESKTOP_SETTINGS_FILE);
        let share_on_local_network = read_share_on_local_network(&settings_path);
        let bind_host = if share_on_local_network {
            "0.0.0.0"
        } else {
            "127.0.0.1"
        };
        let workdir = bundled_next_dir()?;

        fs::create_dir_all(&runtime_dir).map_err(|error| error.to_string())?;
        fs::create_dir_all(&file_storage_root).map_err(|error| error.to_string())?;

        Ok(Self {
            workdir,
            env_file: app_support_dir.join(".env.local"),
            frontend_health_url: DEFAULT_FRONTEND_URL.to_string(),
            backend_enabled: false,
            backend_health_url: DEFAULT_BACKEND_URL.to_string(),
            backend_log_file: runtime_dir.join("praxis-backend.native.log"),
            frontend_log_file: runtime_dir.join("praxis-frontend.native.log"),
            backend_program: "node".to_string(),
            backend_args: Vec::new(),
            backend_env_overrides: Vec::new(),
            frontend_program: node_program_path(),
            frontend_args: vec!["server.js".to_string()],
            frontend_env_overrides: vec![
                ("HOSTNAME".to_string(), bind_host.to_string()),
                ("PORT".to_string(), "3007".to_string()),
                ("NEXT_PUBLIC_API_BASE_URL".to_string(), String::new()),
                ("PRAXIS_API_BASE_URL".to_string(), String::new()),
                (
                    "PRAXIS_DESKTOP_SETTINGS_PATH".to_string(),
                    settings_path.to_string_lossy().to_string(),
                ),
                (
                    "FILE_STORAGE_ROOT".to_string(),
                    file_storage_root.to_string_lossy().to_string(),
                ),
            ],
        })
    }
}

fn managed_runtime_enabled() -> bool {
    std::env::var("PRAXIS_DESKTOP_MANAGED_RUNTIME").ok().as_deref() == Some("1")
        || !cfg!(debug_assertions)
}

fn repo_root_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn app_support_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set.".to_string())?;
    Ok(PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("com.praxis.desktop"))
}

fn bundled_next_dir() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|error| error.to_string())?;
    let resources_dir = exe
        .parent()
        .and_then(Path::parent)
        .map(|path| path.join("Resources"))
        .ok_or_else(|| "Could not locate Praxis app Resources directory.".to_string())?;
    let bundled_dir = resources_dir.join("bundled").join("next");
    if !bundled_dir.exists() {
        return Err(format!(
            "Bundled Next runtime was not found at {}",
            bundled_dir.display()
        ));
    }
    Ok(bundled_dir)
}

fn node_program_path() -> String {
    if let Ok(path) = std::env::var("PRAXIS_DESKTOP_NODE_PATH") {
        let trimmed = path.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    for candidate in ["/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node"] {
        if Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }

    "node".to_string()
}

fn read_share_on_local_network(path: &Path) -> bool {
    let Ok(text) = fs::read_to_string(path) else {
        return true;
    };

    for raw_line in text.lines() {
        let line = raw_line.trim();
        let Some(value) = line.strip_prefix("share_on_local_network=") else {
            continue;
        };

        let normalized = value.trim().to_ascii_lowercase();
        return matches!(normalized.as_str(), "1" | "true" | "yes" | "on");
    }

    true
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
    overrides: &[(String, String)],
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

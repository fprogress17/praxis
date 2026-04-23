use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

use tauri::{
    AppHandle, LogicalPosition, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Position,
    Size, WebviewWindow, WindowEvent,
};

const WINDOW_STATE_FILE: &str = "window-state.txt";

#[derive(Clone, Copy, Debug)]
struct SavedWindowState {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    is_maximized: bool,
}

pub struct WindowStateManager {
    state_path: PathBuf,
    last_normal_state: Mutex<Option<SavedWindowState>>,
}

impl WindowStateManager {
    pub fn for_app(app: &AppHandle) -> Self {
        let base_dir = app
            .path()
            .app_config_dir()
            .ok()
            .or_else(|| std::env::current_dir().ok().map(|dir| dir.join(".runtime")))
            .unwrap_or_else(|| PathBuf::from(".runtime"));
        let _ = fs::create_dir_all(&base_dir);

        Self {
            state_path: base_dir.join(WINDOW_STATE_FILE),
            last_normal_state: Mutex::new(None),
        }
    }

    pub fn restore_main_window(&self, app: &AppHandle) {
        let Some(window) = app.get_webview_window("main") else {
            return;
        };
        let Some(saved_state) = read_state(&self.state_path).filter(|state| is_sane_state(*state))
        else {
            return;
        };

        if let Err(error) = window.set_position(Position::Logical(LogicalPosition::new(
            saved_state.x,
            saved_state.y,
        ))) {
            eprintln!("Could not restore Praxis window position: {}", error);
        }

        if let Err(error) = window.set_size(Size::Logical(LogicalSize::new(
            saved_state.width,
            saved_state.height,
        ))) {
            eprintln!("Could not restore Praxis window size: {}", error);
        }

        if saved_state.is_maximized {
            if let Err(error) = window.maximize() {
                eprintln!("Could not restore Praxis maximized state: {}", error);
            }
        }

        if let Ok(mut state) = self.last_normal_state.lock() {
            *state = Some(saved_state.normal_bounds());
        }
    }

    pub fn handle_window_event(&self, app: &AppHandle, event: &WindowEvent) {
        match event {
            WindowEvent::Moved(position) => self.capture_moved_window(app, *position),
            WindowEvent::Resized(size) => self.capture_resized_window(app, *size),
            WindowEvent::CloseRequested { .. } | WindowEvent::Destroyed => {
                self.persist_main_window(app)
            }
            _ => {}
        }
    }

    pub fn persist_main_window(&self, app: &AppHandle) {
        let Some(window) = app.get_webview_window("main") else {
            return;
        };

        let is_maximized = match window.is_maximized() {
            Ok(value) => value,
            Err(error) => {
                eprintln!("Could not read Praxis window maximize state: {}", error);
                return;
            }
        };

        let cached_state = self
            .last_normal_state
            .lock()
            .ok()
            .and_then(|state| *state)
            .filter(|state| is_sane_state(*state));

        let state_to_write = if is_maximized {
            cached_state.map(|state| state.with_maximized(true))
        } else {
            cached_state
        }
        .or_else(|| {
            capture_window_state(&window, is_maximized)
                .ok()
                .filter(|state| is_sane_state(*state))
        });

        let Some(state_to_write) = state_to_write else {
            return;
        };

        if let Err(error) = write_state(&self.state_path, state_to_write) {
            eprintln!("Could not save Praxis window state: {}", error);
        }
    }

    fn capture_moved_window(&self, app: &AppHandle, position: PhysicalPosition<i32>) {
        let Some(window) = app.get_webview_window("main") else {
            return;
        };
        if matches!(window.is_maximized(), Ok(true)) {
            return;
        }

        let Ok(scale_factor) = window.scale_factor() else {
            return;
        };
        let logical_position = position.to_logical::<f64>(scale_factor);
        if !logical_position.x.is_finite() || !logical_position.y.is_finite() {
            return;
        }

        if let Ok(mut state) = self.last_normal_state.lock() {
            let previous = state.unwrap_or(SavedWindowState {
                x: logical_position.x,
                y: logical_position.y,
                width: 1440.0,
                height: 960.0,
                is_maximized: false,
            });
            *state = Some(SavedWindowState {
                x: logical_position.x,
                y: logical_position.y,
                ..previous.normal_bounds()
            });
        }
    }

    fn capture_resized_window(&self, app: &AppHandle, size: PhysicalSize<u32>) {
        let Some(window) = app.get_webview_window("main") else {
            return;
        };
        if matches!(window.is_maximized(), Ok(true)) {
            return;
        }

        let Ok(scale_factor) = window.scale_factor() else {
            return;
        };
        let logical_size = size.to_logical::<f64>(scale_factor);
        if logical_size.width <= 0.0 || logical_size.height <= 0.0 {
            return;
        }

        if let Ok(mut state) = self.last_normal_state.lock() {
            let previous = state.unwrap_or(SavedWindowState {
                x: 80.0,
                y: 80.0,
                width: logical_size.width,
                height: logical_size.height,
                is_maximized: false,
            });
            let candidate = SavedWindowState {
                width: logical_size.width,
                height: logical_size.height,
                ..previous.normal_bounds()
            };
            if is_sane_state(candidate) {
                *state = Some(candidate);
            }
        }
    }
}

impl SavedWindowState {
    fn normal_bounds(self) -> Self {
        Self {
            is_maximized: false,
            ..self
        }
    }

    fn with_maximized(self, is_maximized: bool) -> Self {
        Self {
            is_maximized,
            ..self
        }
    }
}

fn capture_window_state(
    window: &WebviewWindow,
    is_maximized: bool,
) -> Result<SavedWindowState, String> {
    let scale_factor = window
        .scale_factor()
        .map_err(|error| format!("scale factor lookup failed: {}", error))?;
    let position = window
        .outer_position()
        .map_err(|error| format!("position lookup failed: {}", error))?;
    let size = window
        .outer_size()
        .map_err(|error| format!("size lookup failed: {}", error))?;
    let logical_position = position.to_logical::<f64>(scale_factor);
    let logical_size = size.to_logical::<f64>(scale_factor);

    if logical_size.width <= 0.0 || logical_size.height <= 0.0 {
        return Err("window size is zero".to_string());
    }

    Ok(SavedWindowState {
        x: logical_position.x,
        y: logical_position.y,
        width: logical_size.width,
        height: logical_size.height,
        is_maximized,
    })
}

fn read_state(path: &Path) -> Option<SavedWindowState> {
    let text = fs::read_to_string(path).ok()?;
    let mut x: Option<f64> = None;
    let mut y: Option<f64> = None;
    let mut width: Option<f64> = None;
    let mut height: Option<f64> = None;
    let mut is_maximized = false;

    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }

        let Some((key, value)) = line.split_once('=') else {
            continue;
        };

        match key {
            "x" => x = value.parse().ok(),
            "y" => y = value.parse().ok(),
            "width" => width = value.parse().ok(),
            "height" => height = value.parse().ok(),
            "is_maximized" => {
                is_maximized = matches!(value.trim(), "1" | "true" | "yes");
            }
            _ => {}
        }
    }

    let width = width?;
    let height = height?;
    if width <= 0.0 || height <= 0.0 {
        return None;
    }

    Some(SavedWindowState {
        x: x?,
        y: y?,
        width,
        height,
        is_maximized,
    })
}

fn write_state(path: &Path, state: SavedWindowState) -> Result<(), String> {
    let text = format!(
        "x={}\ny={}\nwidth={}\nheight={}\nis_maximized={}\n",
        state.x,
        state.y,
        state.width,
        state.height,
        if state.is_maximized { 1 } else { 0 }
    );
    fs::write(path, text).map_err(|error| error.to_string())
}

fn is_sane_state(state: SavedWindowState) -> bool {
    state.width >= 600.0
        && state.width <= 10000.0
        && state.height >= 400.0
        && state.height <= 10000.0
        && state.x.is_finite()
        && state.y.is_finite()
}

#[cfg(test)]
mod tests {
    use super::{read_state, write_state, SavedWindowState};
    use std::{fs, path::PathBuf};

    fn test_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(name)
    }

    #[test]
    fn round_trips_window_state_file() {
        let path = test_path("praxis-window-state-roundtrip.txt");
        let state = SavedWindowState {
            x: 10.0,
            y: 20.0,
            width: 1280.0,
            height: 900.0,
            is_maximized: true,
        };

        write_state(&path, state).unwrap();
        let loaded = read_state(&path).unwrap();
        assert_eq!(loaded.x, 10.0);
        assert_eq!(loaded.y, 20.0);
        assert_eq!(loaded.width, 1280.0);
        assert_eq!(loaded.height, 900.0);
        assert!(loaded.is_maximized);

        let _ = fs::remove_file(path);
    }

    #[test]
    fn ignores_zero_sized_state() {
        let path = test_path("praxis-window-state-zero.txt");
        fs::write(&path, "x=1\ny=2\nwidth=0\nheight=600\nis_maximized=0\n").unwrap();
        assert!(read_state(&path).is_none());
        let _ = fs::remove_file(path);
    }
}

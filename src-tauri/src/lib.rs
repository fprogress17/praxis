mod runtime;
mod window_state;

use runtime::ManagedRuntime;
use tauri::Manager;
use window_state::WindowStateManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let managed_runtime = ManagedRuntime::shared();
    if let Err(error) = ManagedRuntime::maybe_start(&managed_runtime) {
        eprintln!("Praxis managed runtime startup failed: {}", error);
    }

    let runtime_for_events = managed_runtime.clone();

    let app = tauri::Builder::default()
        .setup(|app| {
            let window_state = WindowStateManager::for_app(app.handle());
            window_state.restore_main_window(app.handle());
            app.manage(window_state);
            Ok(())
        })
        .on_window_event(|window, event| {
            let state = window.app_handle().state::<WindowStateManager>();
            state.handle_window_event(window.app_handle(), event);
        })
        .manage(managed_runtime)
        .build(tauri::generate_context!())
        .expect("error while running Praxis desktop shell");

    app.run(move |app_handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            let window_state = app_handle.state::<WindowStateManager>();
            window_state.persist_main_window(app_handle);
            if let Ok(mut runtime) = runtime_for_events.lock() {
                runtime.shutdown();
            }
        }
    });
}

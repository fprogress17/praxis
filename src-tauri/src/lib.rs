mod runtime;

use runtime::ManagedRuntime;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let managed_runtime = ManagedRuntime::shared();
    if let Err(error) = ManagedRuntime::maybe_start(&managed_runtime) {
        eprintln!("Praxis managed runtime startup failed: {}", error);
    }

    let runtime_for_events = managed_runtime.clone();

    let app = tauri::Builder::default()
        .manage(managed_runtime)
        .build(tauri::generate_context!())
        .expect("error while running Praxis desktop shell");

    app.run(move |_app_handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Ok(mut runtime) = runtime_for_events.lock() {
                runtime.shutdown();
            }
        }
    });
}

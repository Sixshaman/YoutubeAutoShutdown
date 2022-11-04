#include <cstdlib>
#include <gtk/gtk.h>
#include <chrono>
#include <tuple>

void systemShutdown()
{
    [[maybe_unused]] int ret = system("shutdown -P now");
}

void onAppActivated(GtkApplication* app, [[maybe_unused]] gpointer userData)
{
    using TimePoint             = decltype(std::chrono::high_resolution_clock::now());
    using TimeoutCallbackParams = std::tuple<GtkMessageDialog*, TimePoint>;

    void* timeoutParamsStorage = malloc(sizeof(TimeoutCallbackParams));

    GtkWindow* tmpWindow = GTK_WINDOW(gtk_application_window_new(app));
    GtkWidget* messageDialog = gtk_message_dialog_new(tmpWindow, GTK_DIALOG_MODAL, GTK_MESSAGE_INFO, GTK_BUTTONS_CANCEL, "Shutting down in %d seconds...", 10);

    TimeoutCallbackParams* timeoutParams = new(timeoutParamsStorage) TimeoutCallbackParams(std::make_tuple(GTK_MESSAGE_DIALOG(messageDialog), std::chrono::high_resolution_clock::now()));
    g_timeout_add(100, [](gpointer userData)
    {
        TimeoutCallbackParams params = *static_cast<TimeoutCallbackParams*>(userData);

        GtkMessageDialog*       messageDialog = std::get<0>(params);
        std::chrono::time_point startTime     = std::get<1>(params);

        TimePoint currTime = std::chrono::high_resolution_clock::now();
        int64_t secondsPassed = std::chrono::duration_cast<std::chrono::seconds>(currTime - startTime).count();

        int secondsLeft = 10 - (int)secondsPassed;
        if(secondsLeft >= 0)
        {
            std::string newText = "<span size=\"x-large\">Shutting down in " + std::to_string(secondsLeft) + " seconds...</span>";
            gtk_message_dialog_set_markup(messageDialog, newText.c_str());
        }
        else
        {
            systemShutdown();
        }

        return (gboolean)(secondsLeft >= 0);

    }, timeoutParams);

    gtk_window_set_transient_for(GTK_WINDOW(messageDialog), tmpWindow);

    g_signal_connect(messageDialog, "response", G_CALLBACK(gtk_window_destroy), nullptr);
    g_signal_connect_swapped(messageDialog, "response", G_CALLBACK(gtk_window_destroy), tmpWindow);
    g_signal_connect_swapped(messageDialog, "response", G_CALLBACK(free), timeoutParamsStorage);
    gtk_widget_show(messageDialog);
}

int ShowShutdownTimeoutDialog(int argc, char* argv[])
{
    GtkApplication* app = gtk_application_new("youtube.auto.shutdown", G_APPLICATION_DEFAULT_FLAGS);
    g_signal_connect(app, "activate", G_CALLBACK(onAppActivated), nullptr);
    int status = g_application_run(G_APPLICATION(app), argc, argv);
    g_object_unref(app);

    return status;
}

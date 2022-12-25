#include <cstdlib>
#include <gtk/gtk.h>
#include <chrono>
#include <tuple>
#include <string>

void systemShutdown()
{
    [[maybe_unused]] int ret = system("shutdown -P now");
}

using TimePoint = decltype(std::chrono::high_resolution_clock::now());

struct DialogTimerTextParams
{
    GtkMessageDialog* Dialog;
    TimePoint         StartTime;
    guint             TimerId;
};

void destroyTimerParams(gpointer timerParamsPtr)
{
    DialogTimerTextParams* timerParams = reinterpret_cast<DialogTimerTextParams*>(timerParamsPtr);
    g_source_remove(timerParams->TimerId);
    delete timerParams;
}

void onAppActivated(GtkApplication* app, [[maybe_unused]] gpointer userData)
{
    GtkWindow* tmpWindow = GTK_WINDOW(gtk_application_window_new(app));
    GtkWidget* messageDialog = gtk_message_dialog_new(tmpWindow, GTK_DIALOG_MODAL, GTK_MESSAGE_INFO, GTK_BUTTONS_CANCEL, "Shutting down in %d seconds...", 10);

    DialogTimerTextParams* timeoutParams = new DialogTimerTextParams();
    timeoutParams->Dialog = GTK_MESSAGE_DIALOG(messageDialog);
    timeoutParams->StartTime = std::chrono::high_resolution_clock::now();

    timeoutParams->TimerId = g_timeout_add(100, [](gpointer userData)
    {
        DialogTimerTextParams* timerParams = reinterpret_cast<DialogTimerTextParams*>(userData);

        TimePoint currTime = std::chrono::high_resolution_clock::now();
        int64_t secondsPassed = std::chrono::duration_cast<std::chrono::seconds>(currTime - timerParams->StartTime).count();

        int secondsLeft = 10 - (int)secondsPassed;
        if(secondsLeft >= 0)
        {
            std::string newText = "<span size=\"x-large\">Shutting down in " + std::to_string(secondsLeft) + " seconds...</span>";
            gtk_message_dialog_set_markup(timerParams->Dialog, newText.c_str());
        }
        else
        {
            systemShutdown();
        }

        return (gboolean)(secondsLeft >= 0);

    }, timeoutParams);

    gtk_window_set_transient_for(GTK_WINDOW(messageDialog), tmpWindow);

    g_signal_connect_swapped(messageDialog, "response", G_CALLBACK(destroyTimerParams), timeoutParams);
    g_signal_connect_swapped(messageDialog, "response", G_CALLBACK(gtk_window_destroy), messageDialog);
    g_signal_connect_swapped(messageDialog, "response", G_CALLBACK(gtk_window_destroy), tmpWindow);

    gtk_widget_show(messageDialog);
}

int ShowShutdownTimeoutDialog(int argc, char* argv[])
{    
    GtkApplication* app = gtk_application_new("youtube.auto.shutdown", G_APPLICATION_FLAGS_NONE);
    g_signal_connect(app, "activate", G_CALLBACK(onAppActivated), nullptr);
    int status = g_application_run(G_APPLICATION(app), 0, nullptr);
    g_object_unref(app);

    return status;
}

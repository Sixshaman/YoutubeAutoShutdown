//Sends a message with a payload to the background script of the active tab
function sendBackgroundScriptMessage(message, payload, onResponse, onError)
{
    browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) 
    {
        for(const tab of tabs)
        {
            browser.runtime.sendMessage({message: message, tabId: tab.id, payload: payload}).then(onResponse).catch(onError);
        }
    });
}

function onVideoShutdownClicked()
{
    const videoShutdownCheckbox    = document.getElementById("YtShutdownOptionVideoCheckbox");
    const playlistShutdownCheckbox = document.getElementById("YtShutdownOptionPlaylistCheckbox");

    let newVideoCheckboxState    = !videoShutdownCheckbox.checked;
    let newPlaylistCheckboxState = playlistShutdownCheckbox.checked;
    if(newVideoCheckboxState)
    {
        //Only one of two options may be active at a time
        newPlaylistCheckboxState = false;   
    }

    sendBackgroundScriptMessage("ytshutdown_set_settings", {videoShutdown: newVideoCheckboxState, playlistShutdown: newPlaylistCheckboxState},
    (_response) => 
    {
        //Only update the checkbox states if the native app check passed successfully
        playlistShutdownCheckbox.checked = newPlaylistCheckboxState;
        videoShutdownCheckbox.checked    = newVideoCheckboxState;
    },
    (_error) => {});
}

function onPlaylistShutdownClicked()
{
    const videoShutdownCheckbox    = document.getElementById("YtShutdownOptionVideoCheckbox");
    const playlistShutdownCheckbox = document.getElementById("YtShutdownOptionPlaylistCheckbox");

    let newPlaylistCheckboxState = !playlistShutdownCheckbox.checked;
    let newVideoCheckboxState    = videoShutdownCheckbox.checked;
    if(newPlaylistCheckboxState)
    {
        //Only one of two options may be active at a time
        newVideoCheckboxState = false;   
    }

    sendBackgroundScriptMessage("ytshutdown_set_settings", {videoShutdown: newVideoCheckboxState, playlistShutdown: newPlaylistCheckboxState},
    (_response) => 
    {
        //Only update the checkbox states if the native app check passed successfully
        playlistShutdownCheckbox.checked = newPlaylistCheckboxState;
        videoShutdownCheckbox.checked    = newVideoCheckboxState;
    },
    (_error) => {});
}

function ytShutdownPopupMain()
{
    document.getElementById("YtShutdownOptionVideo").addEventListener("click", onVideoShutdownClicked);
    document.getElementById("YtShutdownOptionPlaylist").addEventListener("click", onPlaylistShutdownClicked);

    sendBackgroundScriptMessage("ytshutdown_get_settings", null,
    (response) =>
    {
        //Display current state
        document.getElementById("YtShutdownOptionVideoCheckbox").checked    = response.shutdownAfterVideo;
        document.getElementById("YtShutdownOptionPlaylistCheckbox").checked = response.shutdownAfterPlaylist;

        document.getElementById("YtShutdownOptionPlaylist").hidden = !response.hasPlaylist;
    },
    (_error) => {});
}

ytShutdownPopupMain();
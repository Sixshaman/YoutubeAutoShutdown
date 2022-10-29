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
        newPlaylistCheckboxState = false;   
    }

    sendBackgroundScriptMessage("ytshutdown_set_settings", {videoShutdown: newVideoCheckboxState, playlistShutdown: newPlaylistCheckboxState},
    (_response) => 
    {
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
        newVideoCheckboxState = false;   
    }

    sendBackgroundScriptMessage("ytshutdown_set_settings", {videoShutdown: newVideoCheckboxState, playlistShutdown: newPlaylistCheckboxState},
    (_response) => 
    {
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
        document.getElementById("YtShutdownOptionVideoCheckbox").checked    = response.shutdownAfterVideo;
        document.getElementById("YtShutdownOptionPlaylistCheckbox").checked = response.shutdownAfterPlaylist;

        document.getElementById("YtShutdownOptionPlaylist").hidden = !response.hasPlaylist;
    },
    (_error) => {});
}

ytShutdownPopupMain();
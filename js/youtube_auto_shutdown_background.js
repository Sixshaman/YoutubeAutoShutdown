let ytshutdownTabParameters = new Object();

function testAutoShutdownSignal()
{
    return browser.runtime.sendNativeMessage("youtube.auto.shutdown", "check").then(
    (response) => 
    {
        if(response == "ok")
        {
            return Promise.resolve({status: "ok"});
        }
        else
        {
            return Promise.resolve({status: "user-error", reason: "Received an error from native application: " + response});
        }
    })
    .catch
    (
        (_error) => 
        {
            return Promise.resolve({status: "user-error", reason: "Youtube Auto Shutdown error. Is native application installed?"});
        }
    );
}

function sendAutoShutdownSignal()
{
    return browser.runtime.sendNativeMessage("youtube.auto.shutdown", "shutdown").then(
    (_response) => 
    {
        return Promise.resolve({status: "ok"});
    })
    .catch
    (
        (_error) => 
        {
            return Promise.resolve({status: "user-error", reason: "Youtube Auto Shutdown error. Is native application installed?"});
        }
    );
}

function handleContentScriptMessage(request, sender, sendResponse)
{
    if(sender.id == "youtube_auto_shutdown@sixshaman.org")
    {
        if(request.message == "ytshutdown_register_tab")
        {
            let oldTabParameters = ytshutdownTabParameters[sender.tab.id];
            if(oldTabParameters === undefined)
            {
                oldTabParameters = {shutdownAfterVideo: false, shutdownAfterPlaylist: false};
            }
            else if(oldTabParameters.shutdownAfterPlaylist && !request.payload.hasPlaylist)
            {
                oldTabParameters.shutdownAfterPlaylist = false;
            }

            ytshutdownTabParameters[sender.tab.id] = 
            {
                shutdownAfterVideo:    oldTabParameters.shutdownAfterVideo,
                shutdownAfterPlaylist: oldTabParameters.shutdownAfterPlaylist,
                hasPlaylist:           request.payload.hasPlaylist
            };

            return Promise.resolve();
        }
        else if(request.message == "ytshutdown_video_ended")
        {
            let tabParameters = ytshutdownTabParameters[sender.tab.id];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            if(tabParameters.shutdownAfterVideo)
            {
                return sendAutoShutdownSignal().then(function()
                {
                    ytshutdownTabParameters[sender.tab.id].shutdownAfterVideo = false;
                });
            }
            else if(tabParameters.shutdownAfterPlaylist && request.payload.playlistEnded)
            {
                return sendAutoShutdownSignal().then(function()
                {
                    ytshutdownTabParameters[sender.tab.id].shutdownAfterPlaylist = false;
                });
            }
            else
            {
                return Promise.resolve();
            }
        }
        else if(request.message == "ytshutdown_get_settings")
        {
            let tabParameters = ytshutdownTabParameters[request.tabId];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            return Promise.resolve(tabParameters);
        }
        else if(request.message == "ytshutdown_set_settings")
        {
            let tabParameters = ytshutdownTabParameters[request.tabId];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            let messagePayload = {anyShutdown: request.payload.videoShutdown || request.payload.playlistShutdown};
            let scriptRequest = {message: "ytshutdown_enable_shutdown", payload: messagePayload};
            return browser.tabs.sendMessage(request.tabId, scriptRequest).then
            (
                (_response) =>
                {
                    tabParameters.shutdownAfterVideo    = request.payload.videoShutdown;
                    tabParameters.shutdownAfterPlaylist = request.payload.playlistShutdown;

                    return Promise.resolve();
                }
            );
        }
        else if(request.message == "ytshutdown_check_native_app")
        {
            let tabParameters = ytshutdownTabParameters[sender.tab.id];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            return testAutoShutdownSignal();
        }
    }

    return false;
}

browser.runtime.onMessage.addListener(handleContentScriptMessage);

browser.tabs.onRemoved.addListener(function(tabId, removeInfo)
{
    delete ytshutdownTabParameters[tabId];
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab)
{
    let tabParameters = ytshutdownTabParameters[tabId];
    if(!tabParameters)
    {
        return Promise.reject(new Error("Tab not registered"));
    }

    let messagePayload = 
    {
        shutdownEnabled: tabParameters.shutdownAfterPlaylist
    };

    return browser.tabs.sendMessage(tabId, {message: "ytshutdown_update_tab", payload: messagePayload});
});

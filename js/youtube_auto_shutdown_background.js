let ytshutdownTabParameters = new Object();

//Sends a test message to the native app, checking if it works
function testAutoShutdownSignal()
{
    return browser.runtime.sendNativeMessage("youtube.auto.shutdown", "check").then(
    (response) => 
    {
        if(response == "ok")
        {
            return Promise.resolve();
        }
        else
        {
            return Promise.reject({message: "Received an error from native application: " + response});
        }
    })
    .catch((_error) => 
    {
        return Promise.reject({message: "Youtube Auto Shutdown error. Is native application installed?"});
    });
}

//Sends a "PC shutdown" message to the native app
function sendAutoShutdownSignal()
{
    return browser.runtime.sendNativeMessage("youtube.auto.shutdown", "shutdown").then(
    (_response) => 
    {
        return Promise.resolve();
    })
    .catch((_error) => 
    {
        return Promise.reject({message: "Youtube Auto Shutdown error. Is native application installed?"});
    });
}

function handleContentScriptMessage(request, sender, sendResponse)
{
    if(sender.id == "youtube_auto_shutdown@sixshaman.org")
    {
        if(request.message == "ytshutdown_register_tab")
        {
            //YouTube video tab opened/updated, update tab shutdown settings
            let tabParameters = ytshutdownTabParameters[sender.tab.id];
            if(tabParameters === undefined)
            {
                //New YouTube tab opened, initialize new shutdown settings
                tabParameters = {shutdownAfterVideo: false, shutdownAfterPlaylist: false};
            }
            else if(tabParameters.shutdownAfterPlaylist && !request.payload.hasPlaylist)
            {
                //Existing YouTube tab updated, and the current page doesn't contain a playlist. Disable playlist shutdown
                tabParameters.shutdownAfterPlaylist = false;
            }

            ytshutdownTabParameters[sender.tab.id] = 
            {
                shutdownAfterVideo:    tabParameters.shutdownAfterVideo,
                shutdownAfterPlaylist: tabParameters.shutdownAfterPlaylist,
                hasPlaylist:           request.payload.hasPlaylist
            };

            return Promise.resolve();
        }
        else if(request.message == "ytshutdown_video_ended")
        {
            //Video end detected, send a message to the native app
            let tabParameters = ytshutdownTabParameters[sender.tab.id];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            let shutdownAfterVideo    = tabParameters.shutdownAfterVideo;
            let shutdownAfterPlaylist = tabParameters.shutdownAfterPlaylist && request.payload.playlistEnded;

            if(shutdownAfterVideo || shutdownAfterPlaylist)
            {
                return sendAutoShutdownSignal().then(function()
                {
                    //Reset the tab shutdown settings
                    ytshutdownTabParameters[sender.tab.id].shutdownAfterVideo    = false;
                    ytshutdownTabParameters[sender.tab.id].shutdownAfterPlaylist = false;
                });
            }
            else
            {
                //Do nothing, shutdown not needed
                return Promise.resolve();
            }
        }
        else if(request.message == "ytshutdown_get_settings")
        {
            //Return the tab shutdown settings
            let tabParameters = ytshutdownTabParameters[request.tabId];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            return Promise.resolve(tabParameters);
        }
        else if(request.message == "ytshutdown_set_settings")
        {
            //Update the tab shutdown parameters
            let tabParameters = ytshutdownTabParameters[request.tabId];
            if(!tabParameters)
            {
                return Promise.reject(new Error("Tab not registered"));
            }

            return testAutoShutdownSignal().then(
            (_response) => 
            {
                //Native app responded successfully, ask the tab to register video end event
                tabParameters.shutdownAfterVideo    = request.payload.videoShutdown;
                tabParameters.shutdownAfterPlaylist = request.payload.playlistShutdown;

                let messagePayload = {anyShutdown: request.payload.videoShutdown || request.payload.playlistShutdown};
                let scriptRequest = {message: "ytshutdown_enable_shutdown", payload: messagePayload};

                return browser.tabs.sendMessage(request.tabId, scriptRequest);
            })
            .catch((error) => 
            {
                //Native app error, ask the tab to show error header
                let scriptRequest = {message: "ytshutdown_show_error", payload: error.message};
                return browser.tabs.sendMessage(request.tabId, scriptRequest);
            });
        }
    }

    return false;
}

function ytShutdownBackgroundEntryPoint()
{
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
}

ytShutdownBackgroundEntryPoint();
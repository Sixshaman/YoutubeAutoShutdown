function showErrorHeader(errorText)
{
    const docZIndices         = Array.from(document.querySelectorAll("body *"), element => window.getComputedStyle(element).zIndex);
    const docZIndicesFiltered = docZIndices.map(zIndexStr => parseFloat(zIndexStr)).filter(zIndex => !Number.isNaN(zIndex));
    const highestZIndex       = Math.max(...docZIndicesFiltered, 0);

    const headerZIndex      = highestZIndex + 1;
    const closeButtonZIndex = highestZIndex + 2;

    const oldErrorHeader = document.getElementById("YoutubeShutdownErrorHeader");
    if(oldErrorHeader)
    {
        document.body.removeChild(oldErrorHeader);
    }

    let divText = document.createElement("p");
    divText.style.marginTop = "0px";
    divText.style.width     = "100%";
    divText.style.position  = "absolute";
    divText.style.zIndex    = headerZIndex.toString();

    let divTextContent = document.createTextNode(errorText);
    divText.appendChild(divTextContent);
    
    let divCloseButton = document.createElement("p");
    divCloseButton.setAttribute("id", "CloseErrorMessageX");
    divCloseButton.style.marginTop   = "0px";
    divCloseButton.style.marginRight = "10px";
    divCloseButton.style.zIndex      = closeButtonZIndex.toString();

    let divCloseButtonContent = document.createTextNode("X");
    divCloseButton.appendChild(divCloseButtonContent);

    let errorHeader = document.createElement("div");
    errorHeader.style.background    = "#EB3C18FF";
    errorHeader.style.color         = "beige";
    errorHeader.style.position      = "fixed";
    errorHeader.style.width         = "100%";
    errorHeader.style.height        = "30px";
    errorHeader.style.top           = "0";
    errorHeader.style.fontSize      = "25px";
    errorHeader.style.textAlign     = "center";
    errorHeader.style.display       = "flex";
    errorHeader.style.flexDirection = "column";
    errorHeader.style.alignItems    = "flex-end";
    errorHeader.style.zIndex        = headerZIndex.toString();

    errorHeader.appendChild(divText);
    errorHeader.appendChild(divCloseButton);

    errorHeader.setAttribute("id", "YoutubeShutdownErrorHeader");
    document.body.appendChild(errorHeader);

    divCloseButton.addEventListener("mouseenter", function() 
    {
        divCloseButton.style.color  = "yellow";
        divCloseButton.style.cursor = "default";
    }, false);
    
    divCloseButton.addEventListener("mouseleave", function() 
    {
        divCloseButton.style.color = "white";
    }, false);

    divCloseButton.addEventListener("click", function()
    {
        document.body.removeChild(errorHeader);
    }, false);
}

function getPlaylistInfo()
{
    const content = document.getElementById("content");
    if(content == null)
    {
        return {index: 0, size: 0};
    }
    
    let playlistBox = content.querySelector("#playlist");
    if(playlistBox == null)
    {
        return {index: 0, size: 0};
    }
    
    let publisherContainer = playlistBox.querySelector("#publisher-container");
    if(publisherContainer == null)
    {
        return {index: 0, size: 0};
    }
    
    let playlistPanelNodes = publisherContainer.getElementsByClassName("index-message-wrapper style-scope ytd-playlist-panel-renderer");
    if(playlistPanelNodes.length != 1)
    {
        return {index: 0, size: 0};
    }

    let playlistFormattedStringNodes = playlistPanelNodes[0].getElementsByTagName("yt-formatted-string");
    if(playlistFormattedStringNodes.length != 1)
    {
        return {index: 0, size: 0};
    }

    let playlistInfoNodes = playlistFormattedStringNodes[0].childNodes;
    if(playlistInfoNodes.length != 3)
    {
        return {index: 0, size: 0};
    }

    return {index: Number(playlistInfoNodes[0].textContent), size: Number(playlistInfoNodes[2].textContent)};
}

function isLastPlaylistEntry()
{
    let playlistInfo = getPlaylistInfo();
    return playlistInfo.index >= playlistInfo.size;
}

function registerTab()
{
    let queryString = new URLSearchParams(window.location.search);
    let messagePayload = {hasPlaylist: queryString.has("list")};
    return browser.runtime.sendMessage({message: "ytshutdown_register_tab", payload: messagePayload});
}

function onVideoEnded()
{
    let messagePayload = {playlistEnded: isLastPlaylistEntry()};
    browser.runtime.sendMessage({message: "ytshutdown_video_ended", payload: messagePayload});
}

function registerVideoEndEvent()
{
    let videoElements = document.getElementsByTagName("video");
    if(videoElements.length == 0)
    {
        return;
    }

    videoElements[0].addEventListener("ended", onVideoEnded);
}

function unregisterVideoEndEvent()
{
    let videoElements = document.getElementsByTagName("video");
    if(videoElements.length == 0)
    {
        return;
    }

    videoElements[0].removeEventListener("ended", onVideoEnded);
}

function ytShutdownEntryPoint()
{
    browser.runtime.onMessage.addListener(function(request) 
    {
        if(request.message == "ytshutdown_enable_shutdown")
        {
            if(!request.payload.anyShutdown)
            {
                window.eval(`unregisterVideoEndEvent();`);
                return Promise.resolve();
            }
            else
            {
                return browser.runtime.sendMessage({message: "ytshutdown_check_native_app"}).then
                (
                    (response) =>
                    {
                        if(response.status == "ok")
                        {
                            window.eval(`registerVideoEndEvent();`);
                            return Promise.resolve();
                        }
                        else if(response.status == "user-error")
                        {
                            showErrorHeader(response.reason);
                            return Promise.reject(new Error("Native application error"));
                        }
                    }
                );
            }
        }
        else if(request.message == "ytshutdown_update_tab")
        {
            return registerTab();
        }

        return Promise.resolve();
    });

    exportFunction(getPlaylistInfo,         window, { defineAs: "getPlaylistInfo" });
    exportFunction(isLastPlaylistEntry,     window, { defineAs: "isLastPlaylistEntry" });
    exportFunction(onVideoEnded,            window, { defineAs: "onVideoEnded" });
    exportFunction(registerVideoEndEvent,   window, { defineAs: "registerVideoEndEvent" });
    exportFunction(unregisterVideoEndEvent, window, { defineAs: "unregisterVideoEndEvent" });

    registerTab();
}

ytShutdownEntryPoint();
//Displays error header on top of the page
function showErrorHeader(errorInfo)
{
    let getElementZIndex = (element) => window.getComputedStyle(element).zIndex;

    const zIndexProperties = Array.from(document.querySelectorAll("body *"), getElementZIndex);
    const zIndexValues     = zIndexProperties.map((str) => parseFloat(str));
    const validZIndices    = zIndexValues.filter((num) => !Number.isNaN(num));
    const highestZIndex    = Math.max(...validZIndices, 0);

    const headerZIndex      = highestZIndex + 1;
    const closeButtonZIndex = highestZIndex + 2;

    const oldErrorHeader = document.getElementById("YoutubeShutdownErrorHeader");
    if(oldErrorHeader)
    {
        document.body.removeChild(oldErrorHeader);
    }

    let divNativeAppText = document.createElement("p");
    divNativeAppText.style.marginTop = "0px";
    divNativeAppText.style.zIndex    = headerZIndex.toString();

    let divNativeAppLink = document.createElement("a");
    if(errorInfo.link == "")
    {
        divNativeAppText.style.width = "100%";

        let divTextContent = document.createTextNode(errorInfo.message + errorInfo.suggestion);
        divNativeAppText.appendChild(divTextContent);
    }
    else
    {
        divNativeAppText.style.width        = "50%";
        divNativeAppText.style.textAlign    = "right";   
        divNativeAppText.style.paddingRight = "0.4em";

        let divTextContent = document.createTextNode(errorInfo.message);
        divNativeAppText.appendChild(divTextContent);

        divNativeAppLink.href = errorInfo.link;
        divNativeAppLink.style.marginTop = "0px";
        divNativeAppLink.style.width     = "50%";
        divNativeAppLink.style.textAlign = "left";
        divNativeAppLink.style.color     = "gold";
        divNativeAppLink.style.zIndex    = headerZIndex.toString();

        let divLinkContent = document.createTextNode(errorInfo.suggestion);
        divNativeAppLink.appendChild(divLinkContent);
    }

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
    errorHeader.style.flexDirection = "row";
    errorHeader.style.alignItems    = "flex-end";
    errorHeader.style.zIndex        = headerZIndex.toString();

    errorHeader.appendChild(divNativeAppText);
    errorHeader.appendChild(divNativeAppLink);
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

//Returns the current index and the number of items in the video playlist
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

function onVideoEnded()
{
    let playlistInfo = getPlaylistInfo();
    let isLastPlaylistEntry = playlistInfo.index >= playlistInfo.size;

    let messagePayload = {playlistEnded: isLastPlaylistEntry};
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

function registerTab()
{
    //DOM-accessing functions need to be executed in window context
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
    exportFunction(getPlaylistInfo,         window, { defineAs: "getPlaylistInfo" });
    exportFunction(onVideoEnded,            window, { defineAs: "onVideoEnded" });
    exportFunction(registerVideoEndEvent,   window, { defineAs: "registerVideoEndEvent" });
    exportFunction(unregisterVideoEndEvent, window, { defineAs: "unregisterVideoEndEvent" });

    let queryString = new URLSearchParams(window.location.search);
    let messagePayload = {hasPlaylist: queryString.has("list")};
    return browser.runtime.sendMessage({message: "ytshutdown_register_tab", payload: messagePayload});
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
                window.eval(`registerVideoEndEvent();`);
                return Promise.resolve();
            }
        }
        else if(request.message == "ytshutdown_show_error")
        {
            showErrorHeader(request.payload);
            return Promise.resolve();
        }
        else if(request.message == "ytshutdown_update_tab")
        {
            return registerTab().then(function()
            {
                if(request.payload.shutdownEnabled)
                {
                    window.eval(`registerVideoEndEvent();`);
                }
            });
        }

        return Promise.resolve();
    });

    registerTab();
}

ytShutdownEntryPoint();
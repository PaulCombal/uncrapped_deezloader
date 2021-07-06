chrome.runtime.onMessage.addListener(function(request) {
    if(request.command === "downloadMessageSelected") {
        for(songDownloaded = 0; songDownloaded < selectedSongs.length; songDownloaded++) {
            let key = selectedSongs[songDownloaded];

            //console.log(key);
            download(key);
            loadingQueue++;
        }
    }
    else if(request.command === "downloadMessageAlbumPlaylist") {
        var url = window.location.href.split("/");
        albumPlaylistId = url[url.length-1];
        let req = new XMLHttpRequest();

        if(url[4] == "playlist") {
            req.open("GET", "https://api.deezer.com/playlist/"+albumPlaylistId);
        }
        else if(url[4] == "album") {
            req.open("GET", "https://api.deezer.com/album/"+albumPlaylistId);
        }

        req.addEventListener('readystatechange', function() {
            if(this.readyState === XMLHttpRequest.DONE) {
                var tracks = JSON.parse(this.response)["tracks"]["data"];
                for(iTrack = 0; iTrack < tracks.length; iTrack++) {
                    download(tracks[iTrack]["id"].toString());
                    loadingQueue++;
                }
            }
        });
        req.send(null);
    }
});

var selectedSongs = [];

// chrome.storage.sync.set({ quality: "3" });

var loadingQueue = 0;

var q_store;

chrome.storage.sync.get('quality', function(e){
        if(e.quality) {
            q_store = e.quality;
        } else {
            q_store = '3';
        }
        
});


$(document).ready(function(){

    $("body").append("<style>.is-unlogged .loadingQueue, .is-unlogged .dzldr_dl, .is-unlogged .dzldr_dl_all {display:none; visibility:hidden;} .loadingQueue > * {margin-left:20px;} .downloadSettings > span {cursor:pointer;} .loadingQueue  > .text {margin-left:5px;}</style>");
    $("body").append("<div class='loadingQueue' style='position: fixed; top: 18px; right: 119px; z-index: 99999;'><span class='loading' style='display:none;'>" + loaderIcon + "</span><span class='text'></span><div class='downloadSettings' style='display:inline-block; position:relative;'><select><option value='1'>Mp3 - 128kbit/s</option><option value='3' selected>Mp3 - 320kbit/s</option><option value='9'>Flac - 1.411kbit/s</option></select></div></div>");

    

    $(".downloadSettings select").val(q_store);
});




$(document).on('click','.downloadSettings > span',function() {
    $(".downloadSettings .dlmenu").toggle();
});


function addToDom(){

    if (loadingQueue > 0) {
        var amount = loadingQueue.toString();
        var msg = chrome.i18n.getMessage("downloadsLoading", amount);
        $(".loadingQueue span.text").html(" " + msg);
        $(".loadingQueue span.loading").show();
    } 
    else {
        var msg = chrome.i18n.getMessage("downloadsCompleted");
        $(".loadingQueue span.text").text(msg);
        $(".loadingQueue span.loading").hide();
    }


    var url = window.location.href.split("/");

    var htmlbutton = '<div class="toolbar-item dzldr_dl_all"><div><div class="tooltip-wrapper"><button class="root-0-3-1 containedPrimary-0-3-9 downloadPlaylist" type="button" aria-label="Download Playlist"><span class="label-0-3-2">Download Playlist</span></button></div></div></div>';



    
    //$(".ads").remove();
    $(".conversion-banner").remove();



    if($(".toolbar-wrapper-full").children('.toolbar-item').hasClass('dzldr_dl_all')) {}
    else {
        $(".toolbar-wrapper-full").append(htmlbutton);
    }

    $("#page_naboo_smarttracklist .dzldr_dl_all").hide();
    

    if($(".datagrid-header > .datagrid-row").children('div').hasClass('dzldr_dl')) {}
    else {
        $(".datagrid-header > .datagrid-row").append("<div class='dzldr_dl datagrid-cell' style='color:transparent;'>Download</div>");
    }



    $('.datagrid-row.song').each(function(){

        if($(this).children('div').hasClass('dzldr_dl')) {}
        else {
            
            var href = $(this).find(".cell-title .ellipsis > a").attr('href');
            $(this).append("<div class='dzldr_dl datagrid-cell'><button class='downloadTrack' data-link='" + href + "'>Download</button></div>");
        }      

    });

};



function repeatEverySecond(){

    addToDom();

    setTimeout(repeatEverySecond, 1000);
}

repeatEverySecond();



$(document).on('change','.downloadSettings select',function() {
    chrome.storage.sync.set({ quality: this.value });
    q_store = this.value;
});




$(document).on('click','.downloadTrack',function() {

    if (!q_store){
        var msg = chrome.i18n.getMessage("setQuality");
        alert(msg);
        return;
    }

    var id = $(this).data('link');

    var id = id.split("/");

    console.log(id[3]);
     
    download(id[3]);

    loadingQueue++;

});


$(document).on('click','.downloadPlaylist',function() {

    if (!q_store){
        var msg = chrome.i18n.getMessage("setQuality");
        alert(msg);
        return;
    }

    var url = window.location.href.split("/");
    albumPlaylistId = url[url.length-1];
    let req = new XMLHttpRequest();

    if(url[4] == "playlist") {
        req.open("GET", "https://api.deezer.com/playlist/"+albumPlaylistId);
    }
    else if(url[4] == "album") {
        req.open("GET", "https://api.deezer.com/album/"+albumPlaylistId);
    }

    req.addEventListener('readystatechange', function() {
        if(this.readyState === XMLHttpRequest.DONE) {
            var tracks = JSON.parse(this.response)["tracks"]["data"];
            for(iTrack = 0; iTrack < tracks.length; iTrack++) {
                download(tracks[iTrack]["id"].toString(), JSON.parse(this.response)["title"], iTrack+1);
                loadingQueue++;
            }
        }
    });
    req.send(null);

});



$(document).on('click','.checkbox-input',function() {
    let e = $(this);
    let id = e.parent().parent().parent()[0].dataset.key;
    if(e[0]["checked"] === true) {
        selectedSongs.push(id);
    }
    else {
        selectedSongs.splice(selectedSongs.indexOf(id), 1);
    }
});



function download(ids, album, iTrack)
{
    function calcbfkey(ids) {
        var ret = "";
        const key = "g4el58wc0zvf9na1";
        for(i = 0; i < key.length; i++){
            var char = ids.charCodeAt(i)^ids.charCodeAt(i+16)^key.charCodeAt(i);
            ret = ret.concat(String.fromCharCode(char));
        }
        return ret;
    }

    function ultimatum(reqPicture, infos, name) {
        if(reqPicture.target.readyState === XMLHttpRequest.DONE) {
            infos["alb_picture_array"] = reqPicture.target.response;
            let ids = infos["SNG_ID"];

            
            let quality = q_store; // mp3: 3 flac: 9

            let info_md5 = infos["MD5_ORIGIN"];
            let hash = genurl(info_md5, quality, ids, infos["MEDIA_VERSION"]);

            let req = new XMLHttpRequest();
            req.open("GET", "https://e-cdns-proxy-"+info_md5[0]+".dzcdn.net/mobile/1/"+hash);
            req.responseType = "arraybuffer";
            req.addEventListener('readystatechange', function(e) {
                downloaded(e, infos, quality);
            });
            req.send(null);
        }
    }

    function getSongInfo(){
        if(this.readyState === XMLHttpRequest.DONE) {
            let infos = JSON.parse(this.response)["results"];
            let req = new XMLHttpRequest();

            req.open("GET", "https://e-cdns-images.dzcdn.net/images/cover/"+infos["ALB_PICTURE"]+"/1200x1200-000000-80-0-0.jpg");
            req.responseType = "arraybuffer";
            req.addEventListener('readystatechange', function(e) {
                ultimatum(e, infos, infos["SNG_TITLE"]);
            });
            req.send(null);
        }
    }

    function genurl(infomd5, quality, ids, media) {
        var enc = new TextEncoder();
        let buffer = new ArrayBuffer(infomd5.length + quality.length + ids.length + media.length + 3);
        let data = new Uint8Array(buffer);
        var index = 0;
        var t = 0;

        [infomd5, quality, ids, media].forEach(function(element) {
            for(i=0; i < element.length; i++) {
                data[i+index] = enc.encode(element[i]);
            }
            if(t != 3) {
                index += element.length;
                data[index] = 0xa4;
                index += 1;
            }
            t += 1;
        });

        var dec = new TextDecoder("utf-8");

        var tailleBuffer = md5(data).length + data.length + 2;
        if (tailleBuffer % 16) {
            tailleBuffer += 16 - (tailleBuffer) % 16;
        }
        /////////
        
        let buffer2 = new ArrayBuffer(tailleBuffer);
        let data2 = new Uint8Array(buffer2);
        var index = 0;
        var t = 0;

        [md5(data), data].forEach(function(element){
            if(typeof(element) === "string") {
                for(i=0; i < element.length; i++) {
                    data2[i+index] = enc.encode(element[i]);
                }
            }
            else if(typeof(element) === "object") {
                for(i=0; i < element.length; i++) {
                    data2[i+index] = element[i];
                }
            }
            if(t != 2) {
                index += element.length;
                data2[index] = 0xa4;
                index += 1;
            }
            t += 1;
        });

        let key = [ 0x6a, 0x6f, 0x36, 0x61, 0x65, 0x79, 0x36, 0x68, 0x61, 0x69, 0x64, 0x32, 0x54, 0x65, 0x69, 0x68 ];
        var aesEcb = new aesjs.ModeOfOperation.ecb(key);
        var encryptedBytes = aesEcb.encrypt(data2);
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        return encryptedHex;
    }

    function downloaded(that, infos, quality, single) {
        if(that.target.readyState === XMLHttpRequest.DONE) {
            var arraybuffer = that.target.response;
            var decrypted = new Uint8Array(arraybuffer.byteLength);
            var seg = 0;
            const bf = new Blowfish(fbkey, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
            bf.setIv(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]));
            
            for(i=0; i < arraybuffer.byteLength; i+=2048) {
                if ((arraybuffer.byteLength - i) >= 2048) {
                    var byteArray = new Uint8Array(arraybuffer, i, 2048);
                }
                else {
                    var byteArray = new Uint8Array(arraybuffer, i, arraybuffer.byteLength - i);
                }

                if ((seg%3 == 0) && byteArray.length == 2048) {
                    decrypted.set(bf.decode(byteArray, Blowfish.TYPE.UINT8_ARRAY), i);
                }
                else {
                    decrypted.set(byteArray, i);
                }
                seg += 1;
            }

            var req = new XMLHttpRequest();
            req.open("GET", "https://api.deezer.com/album/"+infos["ALB_ID"]);
            req.addEventListener('readystatechange', function() {
                if(this.readyState === XMLHttpRequest.DONE) {
                    var genres = [];
                    console.log(infos);
                    var genresData = JSON.parse(this.response)["genres"]['data'];
                    for(iGenre = 0; iGenre < genresData.length; iGenre++) {
                        genres.push(genresData[iGenre]["name"]);
                    }
                    var artists = [];
                    for(nbArtists=0; nbArtists < infos["ARTISTS"].length; nbArtists++) {
                        artists.push(infos["ARTISTS"][nbArtists]["ART_NAME"]);
                    }


                    console.log(((arraybuffer.byteLength/1024*8) / infos["DURATION"]) > 400);

                    if (((arraybuffer.byteLength/1024*8) / infos["DURATION"]) < 100) {  

                        if(quality == '9') {
                            var alert_msg = chrome.i18n.getMessage("tracknotAvailableFlac");
                            alert(artists + " - " + infos["SNG_TITLE"] + ": " + alert_msg);
                        } else {
                            var alert_msg = chrome.i18n.getMessage("tracknotAvailable");
                            alert(artists + " - " + infos["SNG_TITLE"] + ": " + alert_msg);
                        }

                        loadingQueue--;
                        console.log("datarate < 100");
                    } 

                    else {

                        if (((arraybuffer.byteLength/1024*8) / infos["DURATION"]) > 400) { 

                            var datatype = "flac";

                            const writer2 = new FLACMetadataEditor(decrypted);

                            const resultArrayBuffer = writer2.arrayBuffer;
                            var blob = new Blob([resultArrayBuffer], {type: 'audio/flac'});

                        }   
                        else {
                            var datatype = "mp3";

                            const writer = new ID3Writer(decrypted);
                            writer.setFrame('TIT2', infos["SNG_TITLE"] + " " + infos["VERSION"]);
                            writer.setFrame('TPE1', artists);
                            writer.setFrame('TALB', infos["ALB_TITLE"]);
                            writer.setFrame('TYER', infos["PHYSICAL_RELEASE_DATE"].split("-")[0]);
                            writer.setFrame('TRCK', infos["TRACK_NUMBER"]);
                            writer.setFrame('APIC', {
                                type: 3,
                                data: infos["alb_picture_array"],
                                description: 'Album picture'
                            });
                            writer.addTag('TCON', genres);
                            var blob = writer.getBlob();


                        }              

                        var urlToDl = URL.createObjectURL(blob);
// .replace(/\//g,"_")
                        var filename = artists + " - " + infos["SNG_TITLE"] + " " + infos["VERSION"];

                        filename = filename.replace(/\//g,"_");

                        // if(album) {
                            
                        //     chrome.runtime.sendMessage({command: "dlThis", url: urlToDl, name: 'deezer_'+datatype+'/'+album+'/'+iTrack+' - ' + filename + '.' + datatype});
                        // }
                        
                        // else {
                        //     chrome.runtime.sendMessage({command: "dlThis", url: urlToDl, name: 'deezer_'+datatype+'/' + filename + '.' + datatype});
                        // }


                        const downloadTrigger = document.createElement('a');
                        downloadTrigger.href = urlToDl;
                        downloadTrigger.download = filename + '.' + datatype;
                        downloadTrigger.click();
                        URL.revokeObjectURL(urlToDl);

                        

                        loadingQueue--;

                    }


                }
            });
            req.send(null);
        }

    }

    const fbkey = calcbfkey(md5(ids));

    let req = new XMLHttpRequest();
    req.open("POST", "https://www.deezer.com/ajax/gw-light.php?api_version=1.0&api_token=null&input=3&method=deezer.getUserData");
    req.addEventListener('readystatechange', function() {
        if(this.readyState === XMLHttpRequest.DONE) {
            let token = JSON.parse(this.response)["results"]["checkForm"];
            let json = JSON.stringify({"sng_id": ids});
            let req = new XMLHttpRequest();

            req.open("POST", "https://www.deezer.com/ajax/gw-light.php?api_version=1.0&api_token="+token+"&input=3&method=song.getData");
            req.addEventListener('readystatechange', getSongInfo);
            req.send(json);
        }
    });
    req.send(null);
}

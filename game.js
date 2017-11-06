window.onload = init;
window.onresize = init;

var mouseDown = false;
var scrolling = false;

var mouseDownX = 0;
var mouseDownY = 0;

var scrollX = 0;
var scrollY = 0;
var tileSize = 16;
var zoom = 2;

var mapWidth = 32;
var mapHeight = 32;

var level = new Array(mapWidth * mapHeight);
for (var y = 0; y < mapHeight; y++) {

    for (var x = 0; x < mapWidth; x++) {
        level[x + y * mapWidth] = {
            color: (Math.floor(Math.random() * 0x20) * 0x10101) + 0x808080,
            visible: false,
            owned: false,
            type: Math.random() < 0.5,
        }
    }
}

function init() {
    var mapCanvas = document.getElementById("map");
    mapCanvas.width = (window.innerWidth) / zoom;
    mapCanvas.height = (window.innerHeight) / zoom;

    mapCanvas.onmousedown = function (event) {
        event.preventDefault();
        mouseDown = true;
        scrolling = false;
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
    }

    window.onmouseup = function (event) {
        event.preventDefault();
        mouseDown = false;
        if (!scrolling) {
            var mapCanvas = document.getElementById("map");
            var xOffs = Math.floor(scrollX + (mapCanvas.width - mapWidth * tileSize) / 2);
            var yOffs = Math.floor(scrollY + (mapCanvas.height - mapHeight * tileSize) / 2);

            var xTile = Math.floor((event.clientX / zoom - xOffs) / tileSize);
            var yTile = Math.floor((event.clientY / zoom - yOffs) / tileSize);
            clickTile(xTile, yTile);
        }
    }

    window.onmousemove = function (event) {
        if (!mouseDown) return;
        event.preventDefault();
        var distX = event.clientX - mouseDownX;
        var distY = event.clientY - mouseDownY;

        var scrollDeadZone = 8;

        if (scrolling || distX * distX + distY * distY > scrollDeadZone * scrollDeadZone) {
            scrolling = true;
            scrollX += distX / zoom;
            scrollY += distY / zoom;
            mouseDownX = event.clientX;
            mouseDownY = event.clientY;
            renderMap();
        }
    }

    renderMap();
}

var selectedX = 0;
var selectedY = 0;

function clickTile(xTile, yTile) {
    if (xTile >= 0 && yTile >= 0 && xTile < mapWidth && yTile < mapHeight) {
        if (level[xTile + yTile * mapWidth].owned) {
            level[xTile + yTile * mapWidth].owned = false;
            level[xTile + yTile * mapWidth].color = 0xff0000;
        } else {
            level[xTile + yTile * mapWidth].owned = true;
            level[xTile + yTile * mapWidth].color = 0xffff00;
        }
        recalcVisibility();
    }
    selectedX = xTile;
    selectedY = yTile;
    renderMap();
}

function recalcVisibility() {
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            level[x + y * mapWidth].visible = false;
        }
    }
    for (var y = 0; y < mapHeight; y++) {
        for (var x = 0; x < mapWidth; x++) {
            if (level[x + y * mapWidth].owned) {
                revealTile(x, y, 4);
            }
        }
    }
}

function revealTile(xTile, yTile, radius) {
    for (var y = yTile - radius; y <= yTile + radius; y++) {
        if (y < 0 || y >= mapHeight) continue;
        for (var x = xTile - radius; x <= xTile + radius; x++) {
            if (x < 0 || x >= mapWidth) continue;
            var xd = x - xTile;
            var yd = y - yTile;
            if (xd * xd + yd * yd <= radius * radius + 2) {
                level[x + y * mapWidth].visible = true;
            }
        }
    }
}

function renderMap() {
    var mapCanvas = document.getElementById("map");

    var xOverflow = Math.max(0, (mapWidth + 4) * tileSize - mapCanvas.width) / 2;
    var yOverflow = Math.max(0, (mapHeight + 4) * tileSize - mapCanvas.height) / 2;

    if (scrollX < -xOverflow) scrollX = -xOverflow;
    if (scrollY < -yOverflow) scrollY = -yOverflow;
    if (scrollX > xOverflow) scrollX = xOverflow;
    if (scrollY > yOverflow) scrollY = yOverflow;

    var map2d = mapCanvas.getContext("2d");
    var xOffs = Math.floor(scrollX + (mapCanvas.width - mapWidth * tileSize) / 2);
    var yOffs = Math.floor(scrollY + (mapCanvas.height - mapHeight * tileSize) / 2);
    var x0 = Math.floor(-xOffs / tileSize);
    var y0 = Math.floor(-yOffs / tileSize);
    var x1 = Math.ceil((-xOffs + mapCanvas.width) / tileSize);
    var y1 = Math.ceil((-yOffs + mapCanvas.height) / tileSize);

    for (var y = y0; y < y1; y++) {
        for (var x = x0; x < x1; x++) {
            if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
                if ((x + y) % 2 == 0) {
                    map2d.fillStyle = "#101010";
                } else {
                    map2d.fillStyle = "#141414";
                }
                map2d.fillRect(x * tileSize + xOffs, y * tileSize + yOffs, tileSize, tileSize);
            } else {
                var col = level[x + y * mapWidth].color;
                if (!level[x + y * mapWidth].visible) {
                    col = (col & 0xfcfcfc) >> 2;
                }
                map2d.fillStyle = "#" + col.toString(16);
                map2d.fillRect(x * tileSize + xOffs, y * tileSize + yOffs, tileSize, tileSize);
                if (selectedX == x && selectedY == y) {
                    map2d.strokeStyle = "#ffffff";
                    map2d.strokeRect(x * tileSize + xOffs + 0.5, y * tileSize + yOffs + 0.5, tileSize - 1, tileSize - 1);
                }
            }
        }
    }
}
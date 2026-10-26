import * as THREE from 'three'
import { CanvasTexture } from "three";

const CHAR_LIST = [
    ' ', '`', '.', '-', "'", ':', '_', ',', '^', '=', ';', '>', '<', '+', '!', 'r', 'c', '*', '/', 'z', '?', 's', 'L', 'T', 'v', ')', 'J', '7', '(', '|', 'F', 'i', '{', 'C', '}', 'f', 'I', '3', '1', 't', 'l', 'u', '[', 'n', 'e', 'o', 'Z', '5', 'Y', 'x', 'j', 'y', 'a', ']', '2', 'E', 'S', 'w', 'q', 'k', 'P', '6', 'h', '9', 'd', '4', 'V', 'p', 'O', 'G', 'b', 'U', 'A', 'K', 'X', 'H', 'm', '8', 'R', 'D', '#', '$', 'B', 'g', '0', 'M', 'N', 'W', 'Q', '%', '&', '@']

const CHAR_COUNT = CHAR_LIST.length

const canvas = document.querySelector("#asciiTexture");
const ctx = canvas.getContext('2d')

export const paintASCIITexture = (width = 0, height = 0, cellSize = 8, fontSize = 8, textColor = "#FFFFFF", drawOutline = true, outlineWidth = 5, invert = false) => {
    canvas.height = height
    canvas.width = width
    if(invert) {
        ctx.fillStyle = '#FFF'
    } else {
        ctx.fillStyle = '#000'
    }
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = textColor
    ctx.font = `bold ${fontSize}px "Inter"`
    CHAR_LIST.forEach((char, idx) => {
        ctx.fillText(char, idx * cellSize + cellSize / 2, cellSize / 2)
        if (drawOutline) {
            ctx.beginPath();
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = textColor;
            ctx.moveTo(idx * cellSize , 0 + outlineWidth/2)
            ctx.lineTo(idx * cellSize + cellSize - outlineWidth/2, 0 + outlineWidth/2)
            ctx.lineTo(idx * cellSize + cellSize - outlineWidth/2, cellSize - outlineWidth/2)
            ctx.lineTo(idx * cellSize + outlineWidth/2, cellSize - outlineWidth/2)
            ctx.lineTo(idx * cellSize + outlineWidth/2, 0 + outlineWidth/2)
            ctx.stroke()
        }
    })

    const texture = new CanvasTexture(canvas)
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true
    texture.flipY = true;


    return { texture, count: CHAR_COUNT, cellSize };
}

export const paintASCIILineTexture = (width = 0, height = 0, cellSize = 8, steps = 8, angle = 0, textColor = "#FFFFFF", drawOutline = true, outlineWidth = 5, invert = false) => {
    canvas.height = height
    canvas.width = width
    if(invert) {
        ctx.fillStyle = '#FFF'
    } else {
        ctx.fillStyle = '#000'
    }
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = textColor
    const angleInRadians = angle * (Math.PI / 180);
    for (let idx = 0; idx < steps; idx++) {
        const center = [idx * cellSize + cellSize / 2, cellSize / 2]
        const start = [center[0] - ((idx / steps) * cellSize / 2 * Math.cos(angleInRadians)), center[1] - (((idx / steps) * cellSize / 2) * Math.sin(angleInRadians))]
        const end = [center[0] + ((idx / steps) * cellSize / 2 * Math.cos(angleInRadians)), center[1] + (((idx / steps) * cellSize / 2) * Math.sin(angleInRadians))]
        ctx.moveTo(start[0], start[1])
        ctx.lineTo(end[0], end[1])
        ctx.stroke();

        if (drawOutline) {
            ctx.beginPath();
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = textColor;
            ctx.moveTo(idx * cellSize, 0)
            ctx.lineTo(idx * cellSize + cellSize, 0)
            ctx.lineTo(idx * cellSize + cellSize, cellSize)
            ctx.lineTo(idx * cellSize, cellSize)
            ctx.lineTo(idx * cellSize, 0)
            ctx.stroke()
        }
    }

    const texture = new CanvasTexture(canvas)
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true
    texture.flipY = true;
    return { texture, count: steps, cellSize };
}

export const updateASCIITexture = (TEXT_TEXTURE_DATA, SHAPE_TEXTURE_DATA, COLOR_DATA, TEXTURE_SELECT, OUTLINE_ENABLED, OUTLINE_WIDTH, INVERT) => {
    if (TEXTURE_SELECT.MODE === "TEXT") {
        return paintASCIITexture(window.innerWidth, window.innerHeight, TEXT_TEXTURE_DATA.CELL_SIZE, TEXT_TEXTURE_DATA.FONT_SIZE, COLOR_DATA.COLOR, OUTLINE_ENABLED, OUTLINE_WIDTH, INVERT)
    } else if (TEXTURE_SELECT.MODE === 'SHAPE') {
        return paintASCIILineTexture(window.innerWidth, window.innerHeight, SHAPE_TEXTURE_DATA.CELL_SIZE, SHAPE_TEXTURE_DATA.STEPS, SHAPE_TEXTURE_DATA.ANGLE, COLOR_DATA.COLOR, OUTLINE_ENABLED, OUTLINE_WIDTH, INVERT)
    }
}
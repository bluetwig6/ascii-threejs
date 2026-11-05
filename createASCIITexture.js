import * as THREE from 'three'
import { CanvasTexture } from "three";

const CHAR_LIST = [
    ' ', '`', '.', '-', "'", ':', '_', ',', '^', '=', ';', '>', '<', '+', '!', 'r', 'c', '*', '/', 'z', '?', 's', 'L', 'T', 'v', ')', 'J', '7', '(', '|', 'F', 'i', '{', 'C', '}', 'f', 'I', '3', '1', 't', 'l', 'u', '[', 'n', 'e', 'o', 'Z', '5', 'Y', 'x', 'j', 'y', 'a', ']', '2', 'E', 'S', 'w', 'q', 'k', 'P', '6', 'h', '9', 'd', '4', 'V', 'p', 'O', 'G', 'b', 'U', 'A', 'K', 'X', 'H', 'm', '8', 'R', 'D', '#', '$', 'B', 'g', '0', 'M', 'N', 'W', 'Q', '%', '&', '@']

const CHAR_COUNT = CHAR_LIST.length

const canvas = document.querySelector("#asciiTexture");
const ctx = canvas.getContext('2d')

export const paintASCIITexture = ({
    width,
    height,
    cellSize,
    fontSize,
    charColor,
    bgColor,
    drawOutline,
    outlineWidth,
}) => {
    canvas.height = height
    canvas.width = width
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = charColor
    ctx.font = `bold ${fontSize}px "Inter"`
    const charsPerRow = Math.floor(width / cellSize)
    CHAR_LIST.forEach((char, idx) => {
        const xPos = idx % charsPerRow * (cellSize)
        const yPos = Math.floor(idx/charsPerRow) * cellSize
        ctx.fillText(char, xPos + cellSize / 2, yPos + cellSize/2)
        if (drawOutline) {
            ctx.beginPath();
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = charColor;
            ctx.moveTo(xPos, yPos + outlineWidth / 2)
            ctx.lineTo(xPos + cellSize - outlineWidth / 2, yPos + outlineWidth / 2)
            ctx.lineTo(xPos + cellSize - outlineWidth / 2, yPos + cellSize - outlineWidth / 2)
            ctx.lineTo(xPos + outlineWidth / 2, yPos + cellSize - outlineWidth / 2)
            ctx.lineTo(xPos + outlineWidth / 2, yPos + outlineWidth / 2)
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

export const paintASCIILineTexture = ({
    width,
    height,
    cellSize,
    steps,
    angle,
    charColor,
    bgColor,
    drawOutline,
    outlineWidth,
}) => {
    canvas.height = height
    canvas.width = width
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = charColor
    const angleInRadians = angle * (Math.PI / 180);
    const charsPerRow = Math.floor(width / cellSize)
    for (let idx = 0; idx < steps; idx++) {
        const xPos = idx % charsPerRow * (cellSize)
        const yPos = Math.floor(idx/charsPerRow) * cellSize
        const center = [xPos + (cellSize / 2), yPos + (cellSize / 2)]
        const start = [center[0] - ((idx / steps) * cellSize / 2 * Math.cos(angleInRadians)), center[1] - (((idx / steps) * cellSize / 2) * Math.sin(angleInRadians))]
        const end = [center[0] + ((idx / steps) * cellSize / 2 * Math.cos(angleInRadians)), center[1] + (((idx / steps) * cellSize / 2) * Math.sin(angleInRadians))]
        ctx.beginPath()
        ctx.moveTo(start[0], start[1])
        ctx.lineTo(end[0], end[1])
        ctx.stroke();

         if (drawOutline) {
            ctx.beginPath();
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = charColor;
            ctx.moveTo(xPos, yPos + outlineWidth / 2)
            ctx.lineTo(xPos + cellSize - outlineWidth / 2, yPos + outlineWidth / 2)
            ctx.lineTo(xPos + cellSize - outlineWidth / 2, yPos + cellSize - outlineWidth / 2)
            ctx.lineTo(xPos + outlineWidth / 2, yPos + cellSize - outlineWidth / 2)
            ctx.lineTo(xPos + outlineWidth / 2, yPos + outlineWidth / 2)
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

export const updateASCIITexture = (props) => {
    if (props.mode === "TEXT") {
        return paintASCIITexture(props)
    } else if (mode === 'SHAPE') {
        return paintASCIILineTexture(props)
    }
}
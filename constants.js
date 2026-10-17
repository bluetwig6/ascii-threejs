export const TEXTURE_SELECT = {
  MODE: "TEXT"
}

export const SHAPE_TEXTURE_DATA = {
  STEPS: 20,
  CELL_SIZE: 12,
  ANGLE: 45,
}

export const TEXT_TEXTURE_DATA = {
  FONT_SIZE: 12,
  CELL_SIZE: 14,
}

export const COLOR_DATA = {
  COLOR: "#FFFFFF",
  PICK_CHAR_COLOR_FROM_VIDEO: false, // todo: hook this up inside the shader
  PICK_BG_COLOR_FROM_VIDEO: false
}

export default {TEXTURE_SELECT, SHAPE_TEXTURE_DATA, TEXT_TEXTURE_DATA, COLOR_DATA}
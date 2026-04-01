const GRUPO_DEV = '-1003375877299';
const GRUPO_PROD = '-1003422780175';

const IS_DEV = process.env.IS_DEV === 'TRUE';
const GRUPO_ID = IS_DEV ? GRUPO_DEV : GRUPO_PROD;
const NAME = IS_DEV ? 'CLIENT1' : 'CLIENT2';
const PORT = 3000;

module.exports = { IS_DEV, GRUPO_ID, NAME, PORT };

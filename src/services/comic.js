const {
  getComicsByCharacters,
  registerComic
} = require("../controllers/comics");

async function getComicsByCharactersServ(characterId, limit = 21, offset = 0) {
  return await getComicsByCharacters(characterId, limit, offset);
}

async function registerComicServ(db, info) {
  return await registerComic(db, info);
}

module.exports = {
  getComicsByCharactersServ,
  registerComicServ
};

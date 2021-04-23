const {
  getCharactersTarget,
  getAllCharacters
} = require("../controllers/characters");

async function getCharactersTargetSrv(db) {
  return await getCharactersTarget(db);
}

async function getAllCharactersSrv(db) {
  return await getAllCharacters(db);
}

module.exports = {
  getCharactersTargetSrv,
  getAllCharactersSrv
};

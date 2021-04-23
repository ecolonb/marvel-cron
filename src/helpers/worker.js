const Database = require("../database/database-config");
const db = new Database();

const {
  getCharactersTargetSrv,
  getAllCharactersSrv
} = require("../services/character");

const { updateLastSync } = require("../controllers/sync");

const allProcess = async () => {
  await getAllCharactersSrv(db);
  await getCharactersTargetSrv();
  await updateLastSync(db);
};

module.exports = {
  allProcess
};

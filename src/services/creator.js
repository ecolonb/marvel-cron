const { registerCreators } = require("../controllers/creators");

async function registerCreatorsServ(db, comic) {
  return await registerCreators(db, comic);
}

module.exports = {
  registerCreatorsServ
};

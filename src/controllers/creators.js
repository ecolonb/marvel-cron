const { asyncForEach } = require("../helpers/functions");

async function saveCreator({ db, creatorId, comicId, name, role }) {
  try {
    const qry = {
      text: `INSERT INTO creator_by_comics(creator_id, comic_id, name, role)
            VALUES ($1, $2, $3, $4);`,
      values: [creatorId, comicId, name, role]
    };
    await db.query(qry);
    console.log("-> Add new Creator: ", creatorId, name, role);
    return true;
  } catch (error) {
    console.log("Error (saveCreator)", error);
  }
}

function getCreatorId(input) {
  const arrInputs = input.split("/");
  return Number(arrInputs[arrInputs.length - 1]);
}

async function existCreator(db, creatorId) {
  try {
    const qry = {
      text: `SELECT * FROM creator_by_comics WHERE creator_id = $1`,
      values: [creatorId]
    };

    const res = await db.query(qry);
    const result = res.rows.length > 0 ? true : false;
    console.log("Creator exist: ", result);
    return result;
  } catch (error) {
    console.log("Error (existCreator): ", error);
    return undefined;
  }
}

async function registerCreators(db, comic) {
  try {
    const comicId = comic.id;
    console.log("comic / creators: ", comic.id, comic.creators.items.length);
    await asyncForEach(comic.creators.items, async (creator) => {
      const { name, role, resourceURI } = creator;
      const creatorId = getCreatorId(resourceURI);

      const isExistCreator = await existCreator(db, creatorId);

      if (isExistCreator === false) {
        const creatorData = {
          db,
          comicId,
          creatorId,
          name,
          role
        };
        await saveCreator(creatorData);

        return true;
      }
    });

    return true;
  } catch (error) {
    console.log("Error (registerCreators): ", error);
  }
}

module.exports = {
  registerCreators
};

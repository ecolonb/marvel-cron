const fetch = require("node-fetch");

const endPoints = {
  comicByCharacterId:
    "https://gateway.marvel.com/v1/public/characters/$id/comics"
};
const { makeHash } = require("../helpers/hash");
const { ts, apiKey, hash } = makeHash();

async function getComicsByCharacters(characterId, limit = 21, offset = 0) {
  let fullEndpoint = endPoints.comicByCharacterId.replace("$id", characterId);
  fullEndpoint = `${fullEndpoint}?apikey=${apiKey}&hash=${hash}&ts=${ts}&limit=${limit}&offset=${offset}`;
  console.log("fullEndpoint: ", fullEndpoint);
  let responseJson = undefined;
  try {
    const resp = await fetch(fullEndpoint);
    const data = await resp.json();
    responseJson = data;
  } catch (error) {
    responseJson = {
      ok: false
    };
  }
  return responseJson;
}

async function existComics(db, comicId) {
  try {
    const qry = {
      text: `SELECT * FROM comics WHERE comic_id = $1`,
      values: [comicId]
    };

    const res = await db.query(qry);
    const result = res.rows.length > 0 ? true : false;
    return result;
  } catch (error) {
    return undefined;
  }
}

async function addNewComic(db, info) {
  try {
    const { id, digitalId, title, thumbnail, description, modified } = info;
    const { path, extension } = thumbnail;
    const _description = description || "";
    const _modified = modified.length !== 24 ? undefined : modified;
    const qry = {
      text: `INSERT INTO comics(
            comic_id, digital_id, title, description, modified, img_path, img_ext)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
      values: [id, digitalId, title, _description, _modified, path, extension]
    };

    await db.query(qry);
    console.log("-> Add new Comic: ", id, title);
    return true;
  } catch (error) {
    console.log("Error (addNewComic): ", error);
  }
}

async function registerComic(db, info) {
  try {
    const existComic = await existComics(db, info.id);

    if (existComic === false) {
      await addNewComic(db, info);
    }
  } catch (error) {
    console.log("Error (registerComic): ", error);
  }
}

module.exports = {
  getComicsByCharacters,
  registerComic
};

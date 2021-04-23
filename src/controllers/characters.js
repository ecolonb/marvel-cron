const fetch = require("node-fetch");
const { makeHash } = require("../helpers/hash");
const {
  getComicsByCharactersServ,
  registerComicServ
} = require("../services/comic");

const { registerCreatorsServ } = require("../services/creator");

const endPoints = {
  getAll: "https://gateway.marvel.com/v1/public/characters"
};

const { asyncForEach } = require("../helpers/functions");

async function getCharacters({ ts, apiKey, hash, limit = 21, offset = 0 }) {
  const fullEndPoint = `${endPoints.getAll}?apikey=${apiKey}&hash=${hash}&ts=${ts}&limit=${limit}&offset=${offset}`;
  console.log("fullEndPoint -> (getCharacters): ", fullEndPoint);
  let responseJson = undefined;
  try {
    const resp = await fetch(fullEndPoint);
    const data = await resp.json();
    responseJson = data;
  } catch (error) {
    responseJson = {
      ok: false
    };
  }
  return responseJson;
}

async function getAllCharacters(db) {
  try {
    await db.connect();
    const { ts, apiKey, hash } = makeHash();
    let limit = 55;
    let offset = 0;
    let salts = 2;
    let isSetted = false;

    for (let i = 0; i <= salts; i++) {
      const params = {
        limit,
        offset,
        ts,
        apiKey,
        hash
      };
      const characters = await getCharacters({ ...params });
      console.log("characters count: ", characters.data.results.length);

      await asyncForEach(characters.data.results, async (character) => {
        await registerCharacter(db, character);
      });
      if (isSetted === false) {
        isSetted = true;
        salts = Math.ceil(Number(characters.data.total) / limit);
      }
      offset += limit;
    }
    await db.disconnect();
    console.log("getAllCharacters end process!");
  } catch (error) {
    console.log("Error -> (getAllCharacters): ", error);
  }
}

async function getCharacterByName(name) {
  const { ts, apiKey, hash } = makeHash();
  const fullEndPoint = `${endPoints.getAll}?apikey=${apiKey}&hash=${hash}&ts=${ts}&name=${name}`;
  let responseJson = undefined;
  try {
    const resp = await fetch(fullEndPoint);
    const data = await resp.json();
    responseJson = data;
  } catch (error) {
    responseJson = {
      ok: false
    };
  }
  return responseJson;
}

async function existCharacter(db, characterId) {
  try {
    const qry = {
      text: `SELECT * FROM characters WHERE character_id = $1`,
      values: [characterId]
    };

    const res = await db.query(qry);
    const result = res.rows.length > 0 ? true : false;
    console.log("isExistCharacter: ", characterId, result);
    return result;
  } catch (error) {
    console.log("Error in (existCharacter)", error);
    return undefined;
  }
}

async function existCharacterByComic(db, comicId, characterId) {
  try {
    const qry = {
      text: `SELECT * FROM character_by_comics WHERE comic_id = $1 AND character_id = $2`,
      values: [comicId, characterId]
    };

    const res = await db.query(qry);
    const result = res.rows.length > 0 ? true : false;
    console.log("-> Exist charByComic: ", result);
    return result;
  } catch (error) {
    console.log("Error (existCharacterByComic)", error);
    return undefined;
  }
}
async function addNewCharacter(db, info) {
  try {
    const { id, name, description, thumbnail } = info;
    const { path, extension } = thumbnail;
    const qry = {
      text: `INSERT INTO characters(character_id, name, description, img_path, img_ext)
            VALUES ($1, $2, $3,$4, $5);
        `,
      values: [id, name, description, path, extension]
    };

    await db.query(qry);
    console.log("-> Add new Character: ", id, name);
    return true;
  } catch (error) {
    console.log("Error (addNewCharacter): ", error);
  }
}

async function saveCharcterByComic(db, comicId, characterId) {
  try {
    const qry = {
      text: `INSERT INTO character_by_comics(comic_id, character_id)
            VALUES ($1, $2);
          `,
      values: [comicId, characterId]
    };
    await db.query(qry);
    console.log(
      "-> Add new CharcterByComic(comicId,characterId): ",
      comicId,
      characterId
    );
    return true;
  } catch (error) {
    console.log("Error (saveCharcterByComic)", error);
  }
}

async function registerCharacter(db, info) {
  try {
    const existChar = await existCharacter(db, info.id);

    if (existChar === false) {
      await addNewCharacter(db, info);
    }
  } catch (error) {
    console.log("Error (registerCharacter): ", error);
  }
}

function getCharacterId(input) {
  const arrInputs = input.split("/");
  return Number(arrInputs[arrInputs.length - 1]);
}

async function registerCharactersByComic(db, comic) {
  try {
    const comicId = comic.id;
    const characters = comic.characters.items;
    console.log("comic / characters: ", comicId, characters.length);

    await asyncForEach(characters, async ({ resourceURI }) => {
      const characterId = getCharacterId(resourceURI);
      const existRelation = await existCharacterByComic(
        db,
        comicId,
        characterId
      );

      if (existRelation === false) {
        await saveCharcterByComic(db, comicId, characterId);
      }
    });
  } catch (error) {
    console.log("Error (registerCharactersByComic)", error);
  }
}

async function getCharactersTarget(db) {
  const characters_target = ["captain america", "iron man"];
  let charactersData = [];
  try {
    await db.connect();
    await asyncForEach(characters_target, async (name) => {
      const charInfo = await getCharacterByName(name);
      charactersData.push({
        id: charInfo.data.results[0].id,
        comicsAvailable: charInfo.data.results[0].comics.available
      });
      await registerCharacter(db, charInfo.data.results[0]);
    });
    await asyncForEach(charactersData, async (characterInfo) => {
      const { id: characterId, comicsAvailable } = characterInfo;
      const limit = 55;
      let offset = 0;
      const salts = Math.round(comicsAvailable / limit);

      for (let i = 0; i <= salts; i++) {
        const comics = await getComicsByCharactersServ(
          characterId,
          limit,
          offset
        );
        for (const comic of comics.data.results) {
          await registerComicServ(db, comic);
          await registerCreatorsServ(db, comic);
          await registerCharactersByComic(db, comic);
        }
        offset += limit;
      }
    });
    await db.disconnect();
  } catch (error) {
    console.log("Error: ", error);
  }
}

module.exports = {
  getAllCharacters,
  getCharacterByName,
  registerCharacter,
  registerCharactersByComic,
  getCharacters,
  getCharactersTarget
};

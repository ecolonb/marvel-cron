async function updateLastSync(db) {
  try {
    await db.connect();
    const qry = {
      text: `INSERT INTO sync_information(last_sync)
            VALUES(NOW());`
    };
    await db.query(qry);
    await db.disconnect();
    return true;
  } catch (error) {
    console.log("Error (saveCreator)", error);
  }
}

module.exports = {
  updateLastSync
};

const db = require("../config/db");

const Role = {};

Role.getAll = (result) => {
  db.query("SELECT * FROM roles", (err, res) => {
    if (err) return result(err, null);
    result(null, res);
  });
};

Role.getById = (id, result) => {
  db.query("SELECT * FROM roles WHERE id = ?", [id], (err, res) => {
    if (err) return result(err, null);
    result(null, res[0]);
  });
};

Role.create = (data, result) => {
  db.query("INSERT INTO roles (name) VALUES (?)", [data.name], (err, res) => {
    if (err) return result(err, null);
    result(null, { id: res.insertId, ...data });
  });
};

Role.update = (id, data, result) => {
  db.query(
    "UPDATE roles SET name = ?, updated_at = NOW() WHERE id = ?",
    [data.name, id],
    (err) => {
      if (err) return result(err, null);
      result(null, { id, ...data });
    }
  );
};


module.exports = Role;

const COUCHDB_VIEWS = {
  contact: process.env.COUCHDB_VIEW_CONTACT,
  become: process.env.COUCHDB_VIEW_BECOME,
  become_condition: process.env.COUCHDB_VIEW_BECOME_CONDITION,
};

const COUCHDB_AUTH = {
  username: process.env.COUCHDB_USERNAME,
  password: process.env.COUCHDB_PASSWORD,
};

module.exports = {
  COUCHDB_VIEWS,
  COUCHDB_AUTH,
};


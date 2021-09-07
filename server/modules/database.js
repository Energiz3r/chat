
mysql = require('mysql')
globals = require('./globals')

const initialCreate = false
const sessionReset = false

/*
  database: blazechat
  user: blaze
  password: BlazeProof1337
  root password: Blaze!proof*1337
*/

let config = {
  host: "localhost"
  ,user: "blazechat"
  ,password: "blaze123"
  ,multipleStatements: true
  ,database: "blazechat"
  ,typeCast: function castField( field, useDefaultTypeCasting ) {
    // We only want to cast bit fields that have a single-bit in them. If the field
    // has more than one bit, then we cannot assume it is supposed to be a Boolean.
    if ((field.type === "BIT") && (field.length === 1)) {
      var bytes = field.buffer();
      // A Buffer in Node represents a collection of 8-bit unsigned integers.
      // Therefore, our single "bit field" comes back as the bits '0000 0001',
      // which is equivalent to the number 1.
      return(bytes[0] === 1)
    }
    return(useDefaultTypeCasting())
  }
}

//const db = mysql.createConnection(config)
var db = mysql.createPool(config)

const showErr = (err) => {
  console.log('╟ SQL Error: ' + err.code + ', ' + err.sqlMessage)
}

initialiseDatabase = () => {

  console.log("╔═════════════════════════════╗")
  console.log("║  Database rebuild started!  ║")
  console.log("╚═════════════════════════════╝")

  config.database = null
  db.query("DROP DATABASE blazechat", (err, result, fields) => {
    if (err) {
      console.log("╟ Delete error (expected):")
      showErr(err)
    } else {
      console.log("╟ Database deleted"); 
    }

    let tempdb = mysql.createConnection(config)

    tempdb.query("CREATE DATABASE IF NOT EXISTS blazechat", (err, result) => {
      if (err) {
        console.log("╟ Create error:")
        showErr(err)
        tempdb.end()
      } else {
        console.log("╟ Database created")
        tempdb.end()
        //re-create the pool
        config.database = "blazechat"
        db = mysql.createPool(config)
        db.query("USE blazechat", (err) => {
          if (err) {
            console.log("╟ error with USE db")
            showErr(err)
          } else {
            // users
          db.query("CREATE TABLE IF NOT EXISTS users (\
            userId int NOT NULL AUTO_INCREMENT,\
            nick varchar(255) NULL,\
            isAdmin bit NOT NULL DEFAULT 0,\
            lastSeen datetime NULL,\
            isGlobalBanned bit NOT NULL DEFAULT 0,\
            email varchar(1024) NULL,\
            password varchar(1024) NULL,\
            PRIMARY KEY (userId))", function (err) {
            if (err) { showErr(err) } else { console.log("╟ 'users' table created") }
  
            db.query("INSERT INTO users (nick, isAdmin, email, password) VALUES ('Energizer', 1, 'tim.eastwood@hotmail.com', SHA2(?, 256))",['jiblet123'],  (err, result) => {
              if (err) { showErr(err) } else { console.log("╟ default user created") }
            })
  
          })
  
          // IP (ip address history)
          db.query("CREATE TABLE IF NOT EXISTS IP (\
            IPId int NOT NULL AUTO_INCREMENT,\
            lastUserId int NOT NULL,\
            IPAddress varchar(255) NOT NULL,\
            lastNick varchar(100),\
            lastActiveDatetime datetime NOT NULL,\
            isGlobalBanned bit NOT NULL DEFAULT 0,\
            lastSessionKey varchar(100),\
            PRIMARY KEY (IPId))", function (err) {
              if (err) { showErr(err) } else { console.log("╟ 'IP' (IP address history) table created") }
          })
  
          // channelPermissions
          db.query("CREATE TABLE IF NOT EXISTS channelPermissions (\
            channelPermissionId int NOT NULL AUTO_INCREMENT,\
            channelId int NOT NULL,\
            userId int NOT NULL,\
            permissionType varchar(100) NOT NULL,\
            allow bit NOT NULL DEFAULT 1,\
            PRIMARY KEY (channelPermissionId))", function (err) {
              if (err) { showErr(err) } else { console.log("╟ 'channelPermissions' table created") }
          })
          
          // sessions
          db.query("CREATE TABLE IF NOT EXISTS sessions (\
            sessionId int NOT NULL AUTO_INCREMENT,\
            sessionKey varchar(100) NOT NULL,\
            lastSocketId varchar(100) NOT NULL,\
            lastActiveDatetime datetime NOT NULL,\
            expiryDatetime datetime NOT NULL,\
            lastNick varchar(100) NULL,\
            lastUserId varchar(100) NULL,\
            PRIMARY KEY (sessionId))", function (err) {
              if (err) { showErr(err) } else { console.log("╟ 'sessions' table created") }
          })
  
          // channels
          db.query("CREATE TABLE IF NOT EXISTS channels (\
            channelId int NOT NULL AUTO_INCREMENT,\
            name varchar(255) NOT NULL,\
            topic varchar(2048) NULL,\
            isVisible bit NOT NULL DEFAULT 1,\
            isDefault bit NOT NULL DEFAULT 1,\
            requireImage bit NOT NULL DEFAULT 0,\
            requireVoice bit NOT NULL DEFAULT 0,\
            requireLogin bit NOT NULL DEFAULT 0,\
            creatorId int NULL,\
            creatorNick varchar(100) NULL,\
            isActive bit NOT NULL DEFAULT 1,\
            PRIMARY KEY (channelId))", function (err) {
              if (err) { showErr(err) } else { console.log("╟ 'channels' table created") }
  
              db.query(
                "INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('lobby', 'Welcome to the lobby', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('help', 'Join this channel to get help using Chat App', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('technology', 'for discussion of all things tech-related', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('music', 'for discussion of all things music', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('movies', 'for discussion of all things movies', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('tv', 'for discussion of all things TV', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('software', 'for discussion of all things software', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('games', 'for discussion of all things games', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('consoles', 'for discussion of all things consoles', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('retro', 'for discussion of all things retro tech', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('art', 'for discussion of all things art', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('photography', 'for discussion of all things photography', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('drones', 'for discussion of all things related to drones', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('travel', 'for discussion of all things travel', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('news', 'for discussion of all things related to world news', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('melbourne', 'people from melbourne, gather here', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('sydney', 'people from sydney, gather here', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('perth', 'people from perth, gather here', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('brisbane', 'people from brisbane, gather here', 0, 'system');\
                INSERT INTO channels (name, topic, creatorId, creatorNick) VALUES ('nz', 'people from new zealand, gather here', 0, 'system');"
                ,  (err) => {
                  if (err) { showErr(err) } else { console.log("╟ Default channels inserted") }
            })
          })
          }
        })
      }      
    })
  })
}

//basic test to make sure at least one of the tables exists
if (!initialCreate) {
  db.query("SELECT 1 FROM users LIMIT 1", (err) => {
    if (err) {
      console.log("Error connecting to database - stopping startup of BlazeChat:")
      showErr(err)
    } else {

      

      globals.databaseConnected = true
      console.log("(database) Connected!")

      //load list of default channels
      db.query("SELECT * FROM channels WHERE isVisible=true AND isActive=true", (err, result) => {
        if (err) {
          console.log("Error getting default channels:")
          showErr(err)
        } else {
          for (var i = 0; i < result.length; i++) {
            globals.channels.push(result[i])
          }
          globals.log("(database) Default channels registered.")
        }
      });

      if (!sessionReset) {
        //restore sessions, skipping ones that had no nick associated
        db.query("SELECT sessionKey, lastSocketId, lastNick, lastUserId, unix_timestamp(expiryDatetime) * 1000 as expiryDatetime FROM sessions WHERE expiryDatetime > NOW()", (err, result) => {
          if (err) {
            console.log("Error restoring sessions:")
            showErr(err)
          } else {
            for (var i = 0; i < result.length; i++) {
              globals.sessions.push({
                sessionKey: result[i].sessionKey,
                socketId: result[i].lastSocketId,
                lastNick: result[i].lastNick,
                lastUserId: result[i].lastUserId,
                expiryDatetime: result[i].expiryDatetime
              })
              globals.log("(database) Session restored for: '" + result[i].lastNick + "', " + result[i].lastUserId + ", " + result[i].sessionKey)
            }
          }
        });
      } else {
        //delete sessions
        db.query("DELETE FROM sessions", (err) => {
          if (err) {
            console.log("Error deleting old sessions:")
            showErr(err)
          }
        });
      }
    }
  })
} else {
  initialiseDatabase()
};

module.exports = db; 

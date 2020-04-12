const fs = require('fs');
const crypto = require('crypto')

class cache {

  constructor() {
    const dir = './cache';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
  }

  filename(id) {
    const hash = crypto.createHash('md5').update(id).digest("hex");
    return `cache/${hash}.json`;
  }

  async get(id) {
    try {
      const data = await fs.readFileSync(this.filename(id), 'utf8')
      return JSON.parse(data);
    } catch (error) {
      console.error(error)
    }
  }

  async set(id, data) {
    try {
      const result = await fs.writeFileSync(this.filename(id), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(error)
    }
    return false;
  }

  async has(id) {
    try {
      await fs.access(this.filename(id), fs.F_OK);
      return true;
    } catch (error) {
      console.error(error);
    }
    return false;
  }
}

module.exports = cache;
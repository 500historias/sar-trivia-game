const { extend } = require('./utils.js');

// SARLIB v1.0.0-beta Copyright (c) 2023-present 500Historias and Collaborators

/**
 * SARLIB v1.0.0-beta Copyright (c) 2023-present 500Historias and Collaborators
 * Clase para manejar todas las peticiones a la API del SAR
 * @param {string} options.uuid - UUID del reto
 * @param {string} options.secretKey - Llave secreta del reto
 * @param {object} options.testMode - Modo de prueba
*/
class SarLib {
  constructor({uuid, secretKey, testMode}) {
    this.initialized = true;
    this.secretKey = secretKey;
    this.challengeUUID = uuid;
    // this.urlApi = "https://500h-sar-dev.accentiostudios.com";
    this.urlApi = "http://localhost:4022";
    this.user = null;
    this.testMode = testMode ?? false;
    this.browser = false;
  }
    
  /**
  * Metodo para obtener todos los el usuario
  * @returns Promise<User>
  * @example
  * const user = await sar.getUser();
  * // returns User
  */
  async getUser(userId) {
    try {
      const currentUserId = userId;
      let myHeaders = new Headers();
      myHeaders.append("sar-secret-key", this.secretKey);
      myHeaders.append("sar-challenge-uuid", this.challengeUUID);
      myHeaders.append("sar-test-mode", this.testMode.toString());
      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };
      const response = await fetch(`${this.urlApi}/v1/challenge/user?id=${currentUserId}`, requestOptions);
      if(response) {
        if(response.status === 200) {
            const data = await response.json();
            this.user = data;
            return data;
        } 
        else {
          const data = await response.json();
          return data;
        }
      }
    } catch(error) {
      if(error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener informacion del usuario al inicializar.');
    }
  }


  makeErrorJsonMessage(message) {
    return JSON.stringify({
      error: true,
      message: message
    });
  }

  /**
   * Metodo para terminar un paso en un reto con pasos
   * @returns Promise<object>
   * @example
   * const response = await sar.addStep();
   * // returns {success: true}
   */
  addStep(userId) {
    try {
      return this.sendRequest('/v1/challenge/add-step', {
        method: 'POST',
        body: {
          userId: userId,
          uuid: this.challengeUUID,
        }
      });
    } catch (error) {
      throw error;
    }
  }


  /** 
   * Metodo para cerrar el webview (solo para mobile)
   * @param {boolean} success - Indica si el reto fue exitoso o no
   * @example
   * sar.closeWebView(true);
   * // returns true
  */
  closeWebView(success) {
    if(window.messageHandler) {
      window.messageHandler.postMessage(success);
      window.close();
    }
  }


  /**
  * Metodo para terminar un reto 
  * @param {boolean} success - Indica si el reto fue exitoso o no
  * @example
  * sar.finishChallenge(true);
  * // returns true
  */
  async finishChallenge(userId, success) {
    try {
      return this.sendRequest('/v1/challenge/finish', {
        method: 'POST',
        body: {
          userId: userId,
          uuid: this.challengeUUID,
          success: success
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Metodo para reintentar una operacion si no se ha inicializado, con un maximo de 3 intentos
   * @param {function} func - Funcion a ejecutar
   * @returns Promise<any>
   * @example
   * sar.retryIfNotDone(async () => {
   *  const response = await fetch(`${this.urlApi}/v1/challenge/add-step`);
   *  const data = await response.json();
   *  return data;
   * });
  */
  async retryIfNotDone(func) {
    let count = 0;
    while (count < 3) {
      const result = await func();
      if (this.initialized === true) {
        return result;
      } else {
        count++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    throw new Error('Se ha intentado 3 veces y no se ha podido realizar la operación');
  }


  /**
   * Metodo para enviar una peticion al servidor
   * @param {string} endpoint - Endpoint a donde se va a realizar la peticion
   * @param {object} options - Opciones de la peticion
   * @param {string} options.method - Metodo de la peticion
   * @param {object} options.body - Cuerpo de la peticion
   * @returns Promise<any>
   * @example
   * sar.sendRequest('/v1/challenge/finish', {
   *  method: 'POST',
   *  body: {
   *    userId: this.user.id,
   *    uuid: this.challengeUUID,
   *    success: success
   *  }
   * });
  */
  async sendRequest(endpoint, options = {}) {
    const urlApi = this.urlApi;

    const headers = {
      'Content-Type': 'application/json',
      'sar-challenge-uuid': this.challengeUUID,
      'sar-secret-key': this.secretKey,
      'sar-test-mode': this.testMode?.toString()
    };

    const requestOptions = {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : null,
    };

    let data = null;

    await this.retryIfNotDone(async () => {
      try {
        const response = await fetch(urlApi + endpoint, requestOptions);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`Message: ${response.message} - Status: ${response.status} - StatusText: ${response.statusText}`);
        }
      } catch (error) {
        throw error;
      }
    });

    return data;
  }

}

function createInstance({uuid, secretKey, testMode}) {
  const instance = new SarLib({uuid: uuid, secretKey: secretKey, testMode: testMode});
  
  // Copy SarLib.prototype to context 
  extend(instance, SarLib.prototype, null, {allOwnKeys: true});

  return instance;
}

SarLib.useExpress = ({uuid, secretKey, testMode}) => (req, res, next) => {
  // Create the default instance to be exported
  const sarLib = createInstance({uuid: uuid, secretKey: secretKey, testMode: testMode});
  req.sar = sarLib;
  next();
};

module.exports = SarLib;
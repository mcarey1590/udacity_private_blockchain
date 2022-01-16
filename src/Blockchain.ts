/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

import bitcoinMessage from 'bitcoinjs-message';
import { Block } from "./Block";
import { InvalidChainError } from './InvalidChainError';
import { BlockMessage } from './Message';
import { Star } from "./Star";

function getTimeInSeconds() {
  return +new Date().getTime().toString().slice(0, -3);
}

function ValidTime(timeInSeconds: number) {
  return getTimeInSeconds() - timeInSeconds > 300;
}

export class Blockchain {
  private readonly _chain: Block[] = [];
  private _height = -1;

  get chain() {
    return this._chain.slice(0);
  }

  get height() {
    return this._height;
  }

  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new Block({ data: "Genesis Block" });
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  async getChainHeight() {
    return this.height;
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  async _addBlock(block: Block) {
    block.height = this._height + 1;
    block.time = getTimeInSeconds();
    const latestBlock = await this.getLatestBlock();
    if (latestBlock && this._height > -1) {
      block.previousBlockHash = latestBlock.hash;
    }
    await block.generateHash();
    this._chain.push(block);
    this._height++;
    await this.validateChain();
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  async requestMessageOwnershipVerification(address: string) {
    const message = new BlockMessage(address, getTimeInSeconds());
    return message.toString();
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  async submitStar(
    address: string,
    message: string,
    signature: string,
    star: Star
  ) {
    const messageTime = new BlockMessage().parse(message).time;
    if (!ValidTime(messageTime)) {
      throw new Error("Message is too old!");
    }
    if (!bitcoinMessage.verify(message, address, signature)) {
      throw new Error('Message is invalid!');
    }
    const block = new Block({
      owner: address,
      star
    });
    await this._addBlock(block);
    return block;
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  async getBlockByHash(hash: string): Promise<Block | null> {
    return this._chain.find((block) => block.hash === hash) || null;
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  async getBlockByHeight(height: number): Promise<Block | null> {
    return this._chain.find((block) => block.height === height) || null;
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  async getStarsByWalletAddress(address: string) {
    const stars = [];
    for (const block of this.chain) {
      const decodedData = await block.getBData();
      if (decodedData?.owner === address) {
        stars.push(decodedData);
      }
    }
    return stars;
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  async validateChain() {
    let errorLog: string[] = [];
    let currentBlock = await this.getLatestBlock();
    if (currentBlock === null) {
      errorLog.push("Latest block not found!");
    }
    while (currentBlock?.previousBlockHash) {
      let blockIsValid = await currentBlock.validate();
      if (!blockIsValid) {
        errorLog.push(`Block ${currentBlock.hash} is invalid!`);
      }
      currentBlock = await this.getBlockByHash(currentBlock.previousBlockHash);
    }
    if (errorLog.length > 0) {
      throw new InvalidChainError(errorLog);
    }
  }

  private async getLatestBlock() {
    return this.getBlockByHeight(this.height);
  }
}

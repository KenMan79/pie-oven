const { ethers } = require("@nomiclabs/buidler");
const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");

const States = {
  DEPOSIT: 0,
  EXCHANGING: 1,
  CLAIM: 2,
};

describe("Oven happy flow", function () {
  let pool;
  let owner;

  before(async function () {
    [owner] = await ethers.getSigners();
    const TestUniswapExchange = await ethers.getContractFactory(
      "TestUniswapExchange"
    );
    pool = await TestUniswapExchange.deploy();
    await pool.deployed();
  });

  it("Should deploy oven", async function () {
    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address);
    oven.deployed();
  });
  it("Join pool", async function () {
    await expect(await oven.getStake(owner.getAddress())).to.be.eq(0);
    await expect(await oven.getTotalValue()).to.be.eq(0);
    await expect(await oven.getState()).to.be.eq(States.DEPOSIT);

    await oven.deposit({ value: parseEther("1") });

    await expect(await oven.getStake(owner.getAddress())).to.be.eq(
      parseEther("1")
    );
    await expect(await oven.getTotalValue()).to.be.eq(parseEther("1"));
  });
  it("Starts exchanging", async function () {
    await expect(await oven.getFinalTotalValue()).to.be.eq(parseEther("0"));
    await oven.setStateExchanging();
    await expect(await oven.getState()).to.be.eq(States.EXCHANGING);
    await expect(await oven.getFinalTotalValue()).to.be.eq(parseEther("1"));

    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );

    await oven.execute(parseEther("0.6"), parseEther("1.2"), 0);

    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("1.2")
    );
    await expect(await oven.getTotalValue()).to.be.eq(parseEther("0.4"));
  });
  it("Finish exchanging", async function () {
    await oven.execute(parseEther("0.4"), parseEther("0.8"), 0);
    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
    await expect(await oven.getTotalValue()).to.be.eq("0");
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );
    await oven.setStateClaim();
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
    await expect(await oven.getState()).to.be.eq(States.CLAIM);
  });
  it("Claim", async function () {
    balance = await pool.balanceOf(owner.getAddress());
    await expect(balance).to.be.eq("0");
    await oven.claim(owner.getAddress());
    balance = await pool.balanceOf(owner.getAddress());
    await expect(balance).to.be.eq(parseEther("2"));
    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
  });
  it("Start deposit state", async function () {
    await oven.setStateDeposit();
    await expect(await oven.getTotalTokensClaimable()).to.be.eq("0");
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq("0");
    await expect(await oven.getTotalValue()).to.be.eq("0");
    await expect(await oven.getFinalTotalValue()).to.be.eq("0");
  });
});

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Prices = require("../models/pricePerMinuteTable");

exports.register_new_prices = asyncHandler(async (req, res) => {
    const exists = await Prices.findOne().exec();
    if (exists) {
      return res.status(400).json({ message: 'Price already exists. Use update instead.' });
    }
    const { basic, luxurious, nightFee } = req.body;
    const price = new Prices({ basic, luxurious, nightFee });
    await price.save();
  
    res.status(201).json(price);
  });

  exports.get_price_table = asyncHandler(async (req, res, next) => {
    try {
      const priceTable = await Prices.findOne().exec();
  
      if (!priceTable || priceTable.length === 0) {
        return res.status(404).json({ message: 'No pricing data found.' });
      }
  
      res.status(200).json(priceTable);
    } catch (error) {
      console.error('Error fetching price table:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

exports.update_price_table = asyncHandler(async (req, res, next) => {
    const { basic, luxurious, nightFee } = req.body;

  let pricing = await Prices.findOne();

  if (!pricing) {
    pricing = new Prices({ basic, luxurious, nightFee });
  } else {
    pricing.basic = basic;
    pricing.luxurious = luxurious;
    pricing.nightFee = nightFee;
  }
  await pricing.save();
  res.json(pricing);
});

exports.get_basic = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    res.json({ basic: price?.basic ?? null });
});

exports.get_luxurious = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    res.json({ luxurious: price?.luxurious ?? null });
});

exports.get_NightFee = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    res.json({ nightFee: price?.nightFee ?? null });
});

exports.update_basic = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    if (!price) return res.status(404).json({ message: 'Price not found' });
    price.basic = req.body.basic;
    await price.save();
    res.json({ basic: price.basic });
});

exports.update_luxurious = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    if (!price) return res.status(404).json({ message: 'Price not found' });
    price.luxurious = req.body.luxurious;
    await price.save();
    res.json({ luxurious: price.luxurious });
});

exports.update_NightFee = asyncHandler(async (req, res) => {
    const price = await Prices.findOne().exec();
    if (!price) return res.status(404).json({ message: 'Price not found' });
    price.nightFee = req.body.nightFee;
    await price.save();
    res.json({ nightFee: price.nightFee });
});


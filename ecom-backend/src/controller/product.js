const Product = require("../models/product");
const shortid = require("shortid");
const slugify = require("slugify");
const Category = require("../models/category");

exports.createProduct = (req, res) => {

  //res.status(200).json( { file: req.files, body: req.body } );

  const {
      name, price, description, category, quantity, createdBy
  } = req.body;
  let productPictures = [];

  if(req.files.length > 0){
      productPictures = req.files.map(file => {
          return { img: file.filename }
      });
  }

  const product = new Product({
      name: name,
      slug: slugify(name),
      price,
      quantity,
      description,
      productPictures,
      category,
      createdBy: req.user._id
  });

  product.save(((error, product) => {
      if(error) return res.status(400).json({ error });
      if(product){
          res.status(201).json({ product });
      }
  }));
};

exports.getProductsBySlug = (req, res) => {
  const { slug } = req.params;
  Category.findOne({ slug: slug })
    .select("_id type")
    .exec((error, category) => {
      if (error) {
        return res.status(400).json({ error });
      }

      if (category) {
        Product.find({ category: category._id }).exec((error, products) => {
          if (error) {
            return res.status(400).json({ error });
          }

          if (category.type) {
            if (products.length > 0) {
              res.status(200).json({
                products,
                priceRange: {
                  under100: 100,
                  under150: 150,
                  under200: 200,
                  under300: 300,
                  under400: 400,
                  under600: 600,
                  under800: 800,
                },
                productsByPrice: {
                  under100: products.filter((product) => product.price <= 100),
                  under150: products.filter(
                    (product) => product.price > 100 && product.price <= 150
                  ),
                  under200: products.filter(
                    (product) => product.price > 150 && product.price <= 200
                  ),
                  under300: products.filter(
                    (product) => product.price > 200 && product.price <= 300
                  ),
                  under400: products.filter(
                    (product) => product.price > 300 && product.price <= 400
                  ),
                  under600: products.filter(
                    (product) => product.price > 400 && product.price <= 600
                  ),
                  under800: products.filter(
                    (product) => product.price > 600 && product.price <= 800
                  ),
                },
              });
            }
          } else {
            res.status(200).json({ products });
          }
        });
      }
    });
};

exports.getProductDetailsById = (req, res) => {
  const { productId } = req.params;
  if (productId) {
    Product.findOne({ _id: productId }).exec((error, product) => {
      if (error) return res.status(400).json({ error });
      if (product) {
        res.status(200).json({ product });
      }
    });
  } else {
    return res.status(400).json({ error: "Params required" });
  }
};

// new update
exports.deleteProductById = (req, res) => {
  const { productId } = req.body.payload;
  if (productId) {
    Product.deleteOne({ _id: productId }).exec((error, result) => {
      if (error) return res.status(400).json({ error });
      if (result) {
        res.status(202).json({ result });
      }
    });
  } else {
    res.status(400).json({ error: "Params required" });
  }
};

exports.getProducts = async (req, res) => {
  const products = await Product.find({ createdBy: req.user._id })
    .select("_id name price quantity slug description productPictures category")
    .populate({ path: "category", select: "_id name" })
    .exec();

  res.status(200).json({ products });
};

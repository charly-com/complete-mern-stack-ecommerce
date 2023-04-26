import asyncHandler from 'express-async-handler'
import products from '../data/products.js'
import Product from '../models/product.js'


export const getProducts = (asyncHandler(async(req, res)=> {
    const pageSize = 8
    const page = Number(req.query.pageNumber) || 1
    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            $options: 'i'
        }
    } : {}
    const count = await Product.countDocuments({...keyword})
    const products = await Product.find({ ...keyword }).limit(pageSize).skip(pageSize * (page - 1))
    res.json({products, page, pages: Math.ceil(count/pageSize)})
}))

export const getProductById = (asyncHandler(async(req, res)=> {
    const product = await Product.findById(req.params.id)
    if(product){
        return res.json(product)
    }else{
         res.status(404)
         throw new Error('product not found')
    
}
}))

export const adminDeleteProduct = (asyncHandler(async(req, res)=> {
    const product = await Product.findById(req.params.id)
    await product.remove()
    res.json({
        message: "Product removed"
    })
}))

export const adminCreateProduct = (asyncHandler(async(req, res)=>{
    const product = await new Product({
        name: 'Sample Name',
        price: 0,
        user: req.user._id,
        image: '/images/sample.jpg',
        brand: 'sample brand',
        category: 'sample category',
        countInStock: 0,
        numReviews: 0,
        description: 'sample description'
    })

    await product.save()
    res.status(201).json({
        product,
        message: "Product created"
    })
}))

export const adminUpdateProduct = (asyncHandler(async(req, res)=>{
    const {name, price, description, category, image, brand, countInStock} = req.body
    const product = await Product.findById(req.params.id)
    if(product){
        const updatedProduct = {
            name,
            price,
            description,
            category,
            image: req.file.path,
            brand,
            countInStock
        }
        await Product.findByIdAndUpdate(req.params.id, {$set: updatedProduct})
        res.status(201).json({
            product,
            message: "Update successful"
        })
    }else{
        res.status(404)
        throw new Error("Product not found")
    }
}))

export const reviewProduct = (asyncHandler(async(req, res)=>{
    const {rating, comment} = req.body
    const product = await Product.findById(req.params.id)
    if(product){
      const reviewed = product.reviews.find(r=> r.user.toString() === req.user._id.toString())
      if(reviewed){
        res.status(400)
        throw new Error("Product already reviewed")
      }else{
        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id
        }
        product.reviews.push(review)
        product.numReviews = product.reviews.length
        product.rating = product.reviews.reduce((acc, item)=>item.rating + acc, 0)/ product.reviews.length
        await product.save()
        res.status(201).json({message: "Review added"})
      }
        res.status(201).json({
            product,
            message: "Update successful"
        })
    }else{
        res.status(404)
        throw new Error("Product not found")
    }
}))

export const getTopProducts = (asyncHandler(async(req, res)=>{
    //get products and sort in ascending order
    const products = await Product.find({}).sort({rating: -1}).limit(3)
    res.json(products)
}))

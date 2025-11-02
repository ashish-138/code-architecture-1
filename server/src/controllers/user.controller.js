import { User } from '../models/user.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'




const registerUser = asyncHandler(async(req,res)=>{
    const { name, email, password} = req.body

    if(
        [name, email, password].some((field)=>field?.trim() === "")
    ){
        throw ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({email})

    if(existingUser) {
        throw ApiError(409, "User is already registered")
    }

    const imagePath = req.files?.image[0]?.path

    if(!imagePath) {
        throw ApiError(400, "Image is required!")
    }

    const user = await User.create({
        name,
        email,
        password,
        imagePath
    }) 

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(200).json(
        ApiResponse(201, createdUser, "User registered Successfully")
    )
    
})


//sign in
const userSignIn = asyncHandler(async(req,res)=>{
    const { email, password } = req.body
    
    if(!email || !password) throw new ApiError(400, 'All fields are required!')
    
    const getUser = await User.findOne({email})

    if(getUser){
        const passwordValidate = await getUser.isPasswordCorrect(password)
        if(!passwordValidate) throw new ApiError(401, 'Invalide user credential!')
    }else{
        throw new ApiError(401, 'Invalide user credential!')
    }

    const loggedInUser = await User.findById(getUser._id).select("-password -image")

    const userData = {
        _id : loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
    }

    const accessToken = await generateAccessToken(userData)

    const options = {
        httpOnly :true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200,{
            user: loggedInUser, accessToken
        },
        "User logged in successfully"
    )
    )
})




export { registerUser }
import { NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import UserModel from '../entities/user.entity'
import { IRequest, IResponse } from '../interfaces/common'
import UserAdminModel from '../entities/user-admin.entity'
import { UnAuthorizeError } from './error.middleware'
const auth = async (req: IRequest, res: IResponse, next: NextFunction) => {
  try {
    let token = req.header('Authorization')

    if (!token) {
      return res.status(401).json({ msg: 'Invalid Authentication.' })
    }
    token = token.split(' ')[1]
    const tokenSecret = process.env.ACCESS_TOKEN_SECRET
    if (!tokenSecret) {
      throw Error('token secret is required')
    }

    const decoded = jwt.verify(token, tokenSecret) as any

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid Authentication.' })
    }
    if (decoded.username === 'admin') {
      const user = await UserAdminModel.findById(decoded.userId)
      if (!user) {
        throw new UnAuthorizeError('user is not admin')
      }
      req.user = user
      next()
      return
    }
    const user = await UserModel.findOne({ _id: decoded.userId })
    if (!user) {
      throw new Error('user not found in system')
    }
    req.user = user
    req.user.userId = user._id

    next()
  } catch (err) {
    if (err instanceof Error) {
      return res.error(401, err.message, err.stack)
    }
    return res.error(401, 'Uncaught Error in auth middleware', '')
  }
}

export default auth

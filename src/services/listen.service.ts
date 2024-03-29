// @ts-nocheck
import mongoose from 'mongoose'
import { STATUS_LECTURE, StageExercise } from '../const/common'
import { convertToLectureDTO } from '../coverter/lecture.mapping'
import { convertToUserDTOWithoutAuth } from '../coverter/user.mapping'
import {
  convertToRecordOfUser,
  convertToVocabularyDTO
} from '../coverter/vocabulary.mapping'
import EnrollmentModel from '../entities/enrollment.entity'
import LectureModel from '../entities/lecture.entity'
import RecordModel from '../entities/record.entity'
import UserModel from '../entities/user.entity'
import VocabularyModel from '../entities/vocabulary.entity'
import {
  IPlaylistListen,
  IPlaylistRequest,
  IPlaylistSummary
} from '../interfaces/dto/listen.dto'

export class ListenService {
  async createOrUpdatePlaylist(payload: IPlaylistRequest) {
    const { favoriteLectureIds, favoriteUserIds, userId } = payload

    if (favoriteLectureIds && favoriteLectureIds.length > 0) {
      await UserModel.findByIdAndUpdate(
        userId,
        { favorite_lecture_ids: favoriteLectureIds },
        { new: true }
      )
    }
    if (favoriteUserIds && favoriteUserIds.length > 0) {
      await UserModel.findByIdAndUpdate(
        userId,
        { favorite_user_ids: favoriteUserIds },
        { new: true }
      )
    }
    return true
  }
  async getPlaylistListenByLecture(payload: IPlaylistListen) {
    const { favoriteUserIds, lectureId } = payload

    const lecture = await LectureModel.findById(lectureId)
    const vocabulariesByLectureId = await VocabularyModel.find({
      lecture: lectureId
    }).sort({ number_order: 1 })

    const userFinishedLecture = await EnrollmentModel.find({
      user: { $in: favoriteUserIds },
      stage: StageExercise.Close,
      lecture: new mongoose.Types.ObjectId(lectureId)
    }).lean()
    const userIds = userFinishedLecture.map((item) => item.user.toString())
    const records = await RecordModel.find({
      user: { $in: userIds },
      challenge: null
    }).populate({
      path: 'user',
      options: { sort: { nick_name: -1 } }
    })

    const participants = vocabulariesByLectureId.map((voca) => {
      const recordUser = records.filter(
        (item) => item.vocabulary.toString() === voca._id.toString()
      )
      return {
        ...convertToVocabularyDTO(voca),
        recordUser: recordUser
          .map((item) => convertToRecordOfUser(item))
          .sort((a, b) => a.nickName.localeCompare(b.nickName))
      }
    })

    return {
      lecture: convertToLectureDTO(lecture),
      vocabularies: vocabulariesByLectureId.map((item) =>
        convertToVocabularyDTO(item)
      ),
      participants: participants.filter(
        (item) => item.recordUser && item.recordUser.length > 0
      )
    }
  }
  async getLecturesAvailable(favorite_lecture_ids: string[]) {
    const aggQuery = [
      {
        $lookup: {
          from: 'lectures',
          localField: 'lecture',
          foreignField: '_id',
          as: 'lectureInfo'
        }
      },
      {
        $unwind: '$lectureInfo'
      },
      {
        $match: { 'lectureInfo.status': STATUS_LECTURE.PUBLIC }
      },
      {
        $group: {
          _id: {
            lectureId: '$lectureInfo._id',
            lectureName: '$lectureInfo.lecture_name'
          },
          vocabularies: { $push: '$$ROOT' },
          totalVocabularies: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          lectureId: '$_id.lectureId',
          lectureName: '$_id.lectureName',
          vocabularies: 1,
          totalVocabularies: 1
        }
      },
      {
        $sort: {
          lectureName: 1
        }
      }
    ]
    const data = await VocabularyModel.aggregate(aggQuery)
    const records = await RecordModel.find({ challenge: null })

    return data
      .map((item) => {
        let totalPeople = 0
        const listVocaIds = item.vocabularies.map((voca: any) =>
          voca._id.toString()
        )
        const recordsByLectures = records.filter((record) =>
          listVocaIds.includes(record?.vocabulary?.toString())
        )
        let usersRecorded = {}
        recordsByLectures.forEach((item) => {
          if (!usersRecorded[item.user._id]) {
            usersRecorded[item.user._id] = 1
          } else {
            usersRecorded[item.user._id] += 1
          }
        })
        for (const i in usersRecorded) {
          if (
            usersRecorded.hasOwnProperty(i) &&
            usersRecorded[i] === item.totalVocabularies
          ) {
            totalPeople += 1
          }
        }

        return {
          totalPeople: totalPeople,
          totalVocabularies: item.totalVocabularies,
          lectureId: item.lectureId,
          lectureName: item.lectureName,
          isSelected: favorite_lecture_ids
            .map((item) => item.toString())
            .includes(item.lectureId.toString())
        }
      })
      .sort((a, b) => a.lectureName.localeCompare(b.lectureName))
  }

  async getUsersAvailable(
    myFavoriteLectureIds: string[],
    myFavoriteUserIds: string[]
  ) {
    const users = await UserModel.find().lean().sort({ nick_name: 1 })
    return users
      .map((user) => {
        let selectedLectures = []
        if (user.completed_lecture_ids) {
          selectedLectures = myFavoriteLectureIds.filter((item) =>
            user.completed_lecture_ids
              .map((item) => item.toString())
              .includes(item.toString())
          )
        }

        return {
          numberSelectedLectures: selectedLectures.length,
          numberCompletedLectures: user.completed_lecture_ids.length,
          isSelected: myFavoriteUserIds
            .map((item) => item.toString())
            .includes(user._id.toString()),
          ...convertToUserDTOWithoutAuth(user)
        }
      })
      .sort((a, b) => a.nickName.localeCompare(b.nickName))
  }
  async getPlaylistSummary(payload: IPlaylistSummary) {
    const { favoriteLectureIds, favoriteUserIds } = payload
    const lectures = await LectureModel.find({
      _id: { $in: favoriteLectureIds },
      status: STATUS_LECTURE.PUBLIC
    })

    return {
      totalLecture: favoriteLectureIds.length,
      totalPeople: favoriteUserIds.length,
      lectures: lectures
        .map((item) => convertToLectureDTO(item))
        .sort((a, b) => a.lectureName.localeCompare(b.lectureName))
    }
  }
}

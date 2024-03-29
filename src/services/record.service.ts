import mongoose from 'mongoose'
import { injectable } from 'tsyringe'
import { STATUS_LECTURE } from '../const/common'
import { convertToRecordsByLectureDTO } from '../coverter/record.mapping'
import LectureModel from '../entities/lecture.entity'
import RecordModel from '../entities/record.entity'
import {
  IRecordByLectureRequest,
  IRecordRequest
} from '../interfaces/dto/record.dto'
import { BadRequestError } from '../middleware/error.middleware'

@injectable()
export default class RecordService {
  async getMyRecordsByLecture(payload: IRecordByLectureRequest) {
    const { lectureId, userId } = payload
    const aggregateQuery = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(lectureId),
          status: STATUS_LECTURE.PUBLIC
        }
      },
      {
        $lookup: {
          from: 'vocabularies',
          localField: '_id',
          foreignField: 'lecture',
          as: 'vocabularies'
        }
      },
      {
        $unwind: '$vocabularies'
      },
      {
        $lookup: {
          from: 'records',
          let: { voca: '$vocabularies._id' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $and: [
                        { $eq: ['$vocabulary', '$$voca'] },
                        { $eq: ['$user', new mongoose.Types.ObjectId(userId)] }
                      ]
                    }
                  },
                  {
                    challenge: { $eq: null }
                  }
                ]
              }
            },
            { $limit: 1 }
          ],
          as: 'vocabularies.record'
        }
      },
      // {
      //   $match: {
      //     'vocabularies.record': { $ne: [] }
      //   }
      // },
      {
        $addFields: {
          'vocabularies.record': { $arrayElemAt: ['$vocabularies.record', 0] }
        }
      },
      {
        $group: {
          _id: '$_id',
          lecture_name: { $first: '$lecture_name' },
          img_src: { $first: '$img_src' },
          created: { $first: '$created' },
          updated: { $first: '$updated' },
          vocabularies: { $push: '$vocabularies' }
        }
      }
    ]
    const data = await LectureModel.aggregate(aggregateQuery)
    return data.map((item) => convertToRecordsByLectureDTO(item))[0]
  }
  async addOrUpdateRecord(payload: IRecordRequest) {
    const {
      challengeId,
      userId,
      vocabularyId,
      voiceSrc,
      finalTranscript,
      score
    } = payload
    if (!vocabularyId || !voiceSrc || !finalTranscript) {
      throw new BadRequestError(
        'Fields required: vocabularyId, voiceSrc, finalTranscript'
      )
    }
    let record
    if (!challengeId) {
      record = await RecordModel.findOneAndUpdate(
        {
          user: userId,
          vocabulary: vocabularyId,
          challenge: null
        },
        {
          voice_src: voiceSrc,
          final_transcript: finalTranscript,
          score: score
        },
        { upsert: true, new: true }
      )
    } else {
      record = await RecordModel.findOneAndUpdate(
        { user: userId, vocabulary: vocabularyId, challenge: challengeId },
        { voice_src: voiceSrc },
        { upsert: true }
      )
    }

    return record?._id
  }
}

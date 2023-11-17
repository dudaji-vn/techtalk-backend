import { injectable } from 'tsyringe'
import LectureModel from '../entities/Lecture'

import VocabularyModel from '../entities/Vocabulary'
import { ILectureDAO } from '../interfaces/dao/lecture.dao'

@injectable()
export default class ScriptService {
  async initData() {
    const lectures: ILectureDAO[] = [
      {
        lecture_name: 'Terminology in IT english',

        img_src: 'https://cdn-icons-png.flaticon.com/512/3285/3285819.png'
      },
      {
        lecture_name: 'Programming Language',

        img_src: 'https://cdn-icons-png.flaticon.com/512/2721/2721614.png'
      },
      {
        lecture_name: 'Acronym in IT English',

        img_src: 'https://cdn-icons-png.flaticon.com/512/10816/10816474.png'
      },
      {
        lecture_name: 'Git - advanced 1',

        img_src: 'https://cdn-icons-png.flaticon.com/512/10816/10816474.png'
      },
      {
        lecture_name: 'Code review 1',

        img_src: 'https://cdn-icons-png.flaticon.com/512/10816/10816474.png'
      },
      {
        lecture_name: 'Code review 2',

        img_src: 'https://cdn-icons-png.flaticon.com/512/10816/10816474.png'
      },
      {
        lecture_name: 'Git - Basic 1',

        img_src: 'https://cdn-icons-png.flaticon.com/512/10816/10816474.png'
      }
    ]

    for (const lecture of lectures) {
      await LectureModel.findOneAndUpdate(
        { lecture_name: lecture.lecture_name },
        lecture,
        { upsert: true }
      )
    }
    const vocabularies = [
      {
        class: 0,
        lecture: '6540bd721860dada50828c4d',
        phonetic_display_language: `/ˈɛksɪˌkjut ðə ˈproʊˌɡræm ənd si ðə rɪˈzʌlt/`,
        title_display_language: 'Execute the program and see the result.',
        title_native_language: 'Thực thi chương trình và xem kết quả',
        native_language: 'vn'
      },
      {
        class: 0,
        lecture: '6540bd721860dada50828cad',
        phonetic_display_language: `/diː-ɛn-ɛs - dəʊˈmeɪn neɪm ˈsɪstəm/`,
        title_display_language: 'DNS - Domain Name System',
        title_native_language: 'Hệ thống tên miền',
        native_language: 'vn'
      },
      {
        class: 0,
        lecture: '6540bd721860dada50828c4d',
        phonetic_display_language: `/ˌriːjuːzəˈbɪləti ɪz wʌn ʌv ðə ki ˈfæktərz ɪn dɪˈzaɪnɪŋ greɪt kəmˈpoʊnənts/`,
        title_display_language:
          'Reusability is one of the key factors in designing great components.',
        title_native_language: 'Tái sử dụng',
        native_language: 'vn'
      },
      {
        class: 1,
        lecture: '6540bd721860dada50828cad',
        phonetic_display_language: `/ˌriːjuːzəˈbɪləti ɪz wʌn ʌv ðə ki ˈfæktərz ɪn dɪˈzaɪnɪŋ greɪt kəmˈpoʊnənts/`,
        title_display_language: 'Test',
        title_native_language: 'Kiểm thử',
        native_language: 'vn'
      },
      {
        class: 1,
        lecture: '6540bd721860dada50828cad',
        phonetic_display_language: `/ˌriːjuːzəˈbɪləti ɪz wʌn ʌv ðə ki ˈfæktərz ɪn dɪˈzaɪnɪŋ greɪt kəmˈpoʊnənts/`,
        title_display_language: 'Test',
        title_native_language: 'Kiểm thử'
      }
    ]

    for (const item of vocabularies) {
      const voca = await VocabularyModel.findOneAndUpdate(
        { title_display_language: item.title_display_language },
        item,
        { upsert: true }
      )
    }
    const vocabulariesData = await VocabularyModel.find()

    return 'Init data'
  }
}

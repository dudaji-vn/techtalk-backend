import {
  IAddCertificateDTO,
  IGetContentDTO,
  IUserCertificateDTO
} from '../../../interfaces/dto/certificate.dto'

export interface ICertificateStrategy {
  addOrUpdateUserContentCertificate(data: IUserCertificateDTO): any
  addCertificate(certificate: IAddCertificateDTO): any
  getContentById(params: IGetContentDTO): any
}
export type TNameCertificateStrategy = 'vocabulary' | 'test'
export class CertificateStrategy {
  strategies: Record<string, ICertificateStrategy> = {}
  use(name: TNameCertificateStrategy, strategy: ICertificateStrategy) {
    this.strategies[name] = strategy
  }
  addOrUpdateUserContentCertificate(
    name: TNameCertificateStrategy,
    ...args: any
  ) {
    if (!this.strategies[name]) {
      throw new Error('Certificate name has not been set')
    }
    return this.strategies[name].addOrUpdateUserContentCertificate.apply(
      null,
      args
    )
  }
  addCertificate(
    name: TNameCertificateStrategy,
    certificate: IAddCertificateDTO
  ) {
    if (!this.strategies[name]) {
      throw new Error('Certificate name has not been set')
    }
    return this.strategies[name].addCertificate.apply(null, [certificate])
  }
  getContentById(name: TNameCertificateStrategy, params: IGetContentDTO) {
    if (!this.strategies[name]) {
      throw new Error('Certificate name has not been set')
    }
    return this.strategies[name].getContentById.apply(null, [params])
  }
}

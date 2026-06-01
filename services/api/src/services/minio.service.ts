import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client | null = null;
  private readonly bucket: string;
  private readonly available: boolean;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'diemdanh');

    try {
      this.client = new Minio.Client({
        endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
        port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
        useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
        accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
        secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      });
      this.available = true;
      this.initBucket();
    } catch (err) {
      this.logger.warn('MinIO not available - file uploads will be skipped');
      this.available = false;
    }
  }

  private async initBucket() {
    if (!this.client) return;
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        // Set public read policy
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          }],
        });
        await this.client.setBucketPolicy(this.bucket, policy);
        this.logger.log(`MinIO bucket '${this.bucket}' created`);
      }
    } catch (err) {
      this.logger.warn(`MinIO bucket init failed: ${err.message}`);
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string | null> {
    if (!this.client || !this.available) return null;

    try {
      const objectName = `${Date.now()}-${filename}`;
      await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
        'Content-Type': mimetype,
      });

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
      const port = this.configService.get<string>('MINIO_PORT', '9000');
      const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
      const protocol = useSSL ? 'https' : 'http';

      return `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;
    } catch (err) {
      this.logger.warn(`Upload failed: ${err.message}`);
      return null;
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    if (!this.client || !this.available) return;
    try {
      // Extract object name from URL if full URL passed
      const name = objectName.includes('/') ? objectName.split('/').slice(-1)[0] : objectName;
      await this.client.removeObject(this.bucket, name);
    } catch (err) {
      this.logger.warn(`Delete failed: ${err.message}`);
    }
  }
}

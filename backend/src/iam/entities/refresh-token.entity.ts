import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshToken extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
  })
  tokenHash: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop({
    type: Object,
    default: {},
  })
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    deviceId?: string;
  };

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop()
  revokedAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes for performance and cleanup
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

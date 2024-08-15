import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const getRawHeaders = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    console.log(ctx);

    const req = ctx.switchToHttp().getRequest();
    const headersRaw = req.rawHeaders;

    return {
      headersRaw,
    };
  },
);

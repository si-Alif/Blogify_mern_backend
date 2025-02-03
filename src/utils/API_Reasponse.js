class API_Response {
    constructor({
        statusCode = 200,
        data = null,
        message = '',
        path = '',
        meta = {}
    } = {}) {
        this.statusCode = Math.max(100, Math.min(599, Number(statusCode)));
        this.success = this.statusCode < 400;
        this.data = data;
        this.message = message;
        this.path = path;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            meta: {
                timestamp: this.timestamp,
                path: this.path,
                ...this.meta
            }
        };
    }

    static success(data, config = {}) {
        return new API_Response({
            ...config,
            data,
            statusCode: config.statusCode || 200
        });
    }

    static paginate(data, paginationInfo, config = {}) {
        return new API_Response({
            ...config,
            data,
            meta: {
                ...config.meta,
                pagination: {
                    page: paginationInfo.page,
                    limit: paginationInfo.limit,
                    total: paginationInfo.total,
                    pages: Math.ceil(paginationInfo.total / paginationInfo.limit)
                }
            }
        });
    }

    withMeta(additionalMeta) {
        return new API_Response({
            statusCode: this.statusCode,
            data: this.data,
            message: this.message,
            path: this.path,
            meta: { ...this.meta, ...additionalMeta }
        });
    }

    toLog() {
        return JSON.stringify({
            statusCode: this.statusCode,
            path: this.path,
            duration: `${Date.now() - new Date(this.timestamp).getTime()}ms`,
            meta: this.meta
        });
    }
}

export { API_Response };
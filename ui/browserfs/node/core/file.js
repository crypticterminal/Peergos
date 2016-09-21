"use strict";
var api_error_1 = require('./api_error');
var BaseFile = (function () {
    function BaseFile() {
    }
    BaseFile.prototype.sync = function (cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.syncSync = function () {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.datasync = function (cb) {
        this.sync(cb);
    };
    BaseFile.prototype.datasyncSync = function () {
        return this.syncSync();
    };
    BaseFile.prototype.chown = function (uid, gid, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.chownSync = function (uid, gid) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.chmod = function (mode, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.chmodSync = function (mode) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.utimes = function (atime, mtime, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.utimesSync = function (atime, mtime) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    return BaseFile;
}());
exports.BaseFile = BaseFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBCQUFrQyxhQUFhLENBQUMsQ0FBQTtBQWlLaEQ7SUFBQTtJQStCQSxDQUFDO0lBOUJRLHVCQUFJLEdBQVgsVUFBWSxFQUEwQjtRQUNwQyxFQUFFLENBQUMsSUFBSSxvQkFBUSxDQUFDLHFCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ00sMkJBQVEsR0FBZjtRQUNFLE1BQU0sSUFBSSxvQkFBUSxDQUFDLHFCQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUNNLDJCQUFRLEdBQWYsVUFBZ0IsRUFBMEI7UUFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBQ00sK0JBQVksR0FBbkI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFDTSx3QkFBSyxHQUFaLFVBQWEsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUEwQjtRQUMvRCxFQUFFLENBQUMsSUFBSSxvQkFBUSxDQUFDLHFCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ00sNEJBQVMsR0FBaEIsVUFBaUIsR0FBVyxFQUFFLEdBQVc7UUFDdkMsTUFBTSxJQUFJLG9CQUFRLENBQUMscUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ00sd0JBQUssR0FBWixVQUFhLElBQVksRUFBRSxFQUEwQjtRQUNuRCxFQUFFLENBQUMsSUFBSSxvQkFBUSxDQUFDLHFCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ00sNEJBQVMsR0FBaEIsVUFBaUIsSUFBWTtRQUMzQixNQUFNLElBQUksb0JBQVEsQ0FBQyxxQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFDTSx5QkFBTSxHQUFiLFVBQWMsS0FBVyxFQUFFLEtBQVcsRUFBRSxFQUEwQjtRQUNoRSxFQUFFLENBQUMsSUFBSSxvQkFBUSxDQUFDLHFCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ00sNkJBQVUsR0FBakIsVUFBa0IsS0FBVyxFQUFFLEtBQVc7UUFDeEMsTUFBTSxJQUFJLG9CQUFRLENBQUMscUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUEvQkQsSUErQkM7QUEvQlksZ0JBQVEsV0ErQnBCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FwaUVycm9yLCBFcnJvckNvZGV9IGZyb20gJy4vYXBpX2Vycm9yJztcclxuaW1wb3J0IFN0YXRzIGZyb20gJy4vbm9kZV9mc19zdGF0cyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZpbGUge1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBHZXQgdGhlIGN1cnJlbnQgZmlsZSBwb3NpdGlvbi5cclxuICAgKiBAcmV0dXJuIFtOdW1iZXJdXHJcbiAgICovXHJcbiAgZ2V0UG9zKCk6IG51bWJlcjtcclxuICAvKipcclxuICAgKiAqKkNvcmUqKjogQXN5bmNocm9ub3VzIGBzdGF0YC5cclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvciwgQnJvd3NlckZTLm5vZGUuZnMuU3RhdHMpXSBjYlxyXG4gICAqL1xyXG4gIHN0YXQoY2I6IChlcnI6IEFwaUVycm9yLCBzdGF0cz86IFN0YXRzKSA9PiBhbnkpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBTeW5jaHJvbm91cyBgc3RhdGAuXHJcbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IsIEJyb3dzZXJGUy5ub2RlLmZzLlN0YXRzKV0gY2JcclxuICAgKi9cclxuICBzdGF0U3luYygpOiBTdGF0cztcclxuICAvKipcclxuICAgKiAqKkNvcmUqKjogQXN5bmNocm9ub3VzIGNsb3NlLlxyXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yKV0gY2JcclxuICAgKi9cclxuICBjbG9zZShjYjogRnVuY3Rpb24pOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBTeW5jaHJvbm91cyBjbG9zZS5cclxuICAgKi9cclxuICBjbG9zZVN5bmMoKTogdm9pZDtcclxuICAvKipcclxuICAgKiAqKkNvcmUqKjogQXN5bmNocm9ub3VzIHRydW5jYXRlLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5cclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXHJcbiAgICovXHJcbiAgdHJ1bmNhdGUobGVuOiBudW1iZXIsIGNiOiBGdW5jdGlvbik6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipDb3JlKio6IFN5bmNocm9ub3VzIHRydW5jYXRlLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5cclxuICAgKi9cclxuICB0cnVuY2F0ZVN5bmMobGVuOiBudW1iZXIpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBBc3luY2hyb25vdXMgc3luYy5cclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXHJcbiAgICovXHJcbiAgc3luYyhjYjogKGU/OiBBcGlFcnJvcikgPT4gdm9pZCk6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipDb3JlKio6IFN5bmNocm9ub3VzIHN5bmMuXHJcbiAgICovXHJcbiAgc3luY1N5bmMoKTogdm9pZDtcclxuICAvKipcclxuICAgKiAqKkNvcmUqKjogV3JpdGUgYnVmZmVyIHRvIHRoZSBmaWxlLlxyXG4gICAqIE5vdGUgdGhhdCBpdCBpcyB1bnNhZmUgdG8gdXNlIGZzLndyaXRlIG11bHRpcGxlIHRpbWVzIG9uIHRoZSBzYW1lIGZpbGVcclxuICAgKiB3aXRob3V0IHdhaXRpbmcgZm9yIHRoZSBjYWxsYmFjay5cclxuICAgKiBAcGFyYW0gW0Jyb3dzZXJGUy5ub2RlLkJ1ZmZlcl0gYnVmZmVyIEJ1ZmZlciBjb250YWluaW5nIHRoZSBkYXRhIHRvIHdyaXRlIHRvXHJcbiAgICogIHRoZSBmaWxlLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBvZmZzZXQgT2Zmc2V0IGluIHRoZSBidWZmZXIgdG8gc3RhcnQgcmVhZGluZyBkYXRhIGZyb20uXHJcbiAgICogQHBhcmFtIFtOdW1iZXJdIGxlbmd0aCBUaGUgYW1vdW50IG9mIGJ5dGVzIHRvIHdyaXRlIHRvIHRoZSBmaWxlLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBwb3NpdGlvbiBPZmZzZXQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlIHdoZXJlIHRoaXNcclxuICAgKiAgIGRhdGEgc2hvdWxkIGJlIHdyaXR0ZW4uIElmIHBvc2l0aW9uIGlzIG51bGwsIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbiBhdFxyXG4gICAqICAgdGhlIGN1cnJlbnQgcG9zaXRpb24uXHJcbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IsIE51bWJlciwgQnJvd3NlckZTLm5vZGUuQnVmZmVyKV1cclxuICAgKiAgIGNiIFRoZSBudW1iZXIgc3BlY2lmaWVzIHRoZSBudW1iZXIgb2YgYnl0ZXMgd3JpdHRlbiBpbnRvIHRoZSBmaWxlLlxyXG4gICAqL1xyXG4gIHdyaXRlKGJ1ZmZlcjogTm9kZUJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBwb3NpdGlvbjogbnVtYmVyLCBjYjogKGVycjogQXBpRXJyb3IsIHdyaXR0ZW4/OiBudW1iZXIsIGJ1ZmZlcj86IE5vZGVCdWZmZXIpID0+IGFueSk6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipDb3JlKio6IFdyaXRlIGJ1ZmZlciB0byB0aGUgZmlsZS5cclxuICAgKiBOb3RlIHRoYXQgaXQgaXMgdW5zYWZlIHRvIHVzZSBmcy53cml0ZVN5bmMgbXVsdGlwbGUgdGltZXMgb24gdGhlIHNhbWUgZmlsZVxyXG4gICAqIHdpdGhvdXQgd2FpdGluZyBmb3IgaXQgdG8gcmV0dXJuLlxyXG4gICAqIEBwYXJhbSBbQnJvd3NlckZTLm5vZGUuQnVmZmVyXSBidWZmZXIgQnVmZmVyIGNvbnRhaW5pbmcgdGhlIGRhdGEgdG8gd3JpdGUgdG9cclxuICAgKiAgdGhlIGZpbGUuXHJcbiAgICogQHBhcmFtIFtOdW1iZXJdIG9mZnNldCBPZmZzZXQgaW4gdGhlIGJ1ZmZlciB0byBzdGFydCByZWFkaW5nIGRhdGEgZnJvbS5cclxuICAgKiBAcGFyYW0gW051bWJlcl0gbGVuZ3RoIFRoZSBhbW91bnQgb2YgYnl0ZXMgdG8gd3JpdGUgdG8gdGhlIGZpbGUuXHJcbiAgICogQHBhcmFtIFtOdW1iZXJdIHBvc2l0aW9uIE9mZnNldCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGUgd2hlcmUgdGhpc1xyXG4gICAqICAgZGF0YSBzaG91bGQgYmUgd3JpdHRlbi4gSWYgcG9zaXRpb24gaXMgbnVsbCwgdGhlIGRhdGEgd2lsbCBiZSB3cml0dGVuIGF0XHJcbiAgICogICB0aGUgY3VycmVudCBwb3NpdGlvbi5cclxuICAgKiBAcmV0dXJuIFtOdW1iZXJdXHJcbiAgICovXHJcbiAgd3JpdGVTeW5jKGJ1ZmZlcjogTm9kZUJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBwb3NpdGlvbjogbnVtYmVyKTogbnVtYmVyO1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBSZWFkIGRhdGEgZnJvbSB0aGUgZmlsZS5cclxuICAgKiBAcGFyYW0gW0Jyb3dzZXJGUy5ub2RlLkJ1ZmZlcl0gYnVmZmVyIFRoZSBidWZmZXIgdGhhdCB0aGUgZGF0YSB3aWxsIGJlXHJcbiAgICogICB3cml0dGVuIHRvLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBvZmZzZXQgVGhlIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlciB3aGVyZSB3cml0aW5nIHdpbGxcclxuICAgKiAgIHN0YXJ0LlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5ndGggQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gcmVhZC5cclxuICAgKiBAcGFyYW0gW051bWJlcl0gcG9zaXRpb24gQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHdoZXJlIHRvIGJlZ2luIHJlYWRpbmcgZnJvbVxyXG4gICAqICAgaW4gdGhlIGZpbGUuIElmIHBvc2l0aW9uIGlzIG51bGwsIGRhdGEgd2lsbCBiZSByZWFkIGZyb20gdGhlIGN1cnJlbnQgZmlsZVxyXG4gICAqICAgcG9zaXRpb24uXHJcbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IsIE51bWJlciwgQnJvd3NlckZTLm5vZGUuQnVmZmVyKV0gY2IgVGhlXHJcbiAgICogICBudW1iZXIgaXMgdGhlIG51bWJlciBvZiBieXRlcyByZWFkXHJcbiAgICovXHJcbiAgcmVhZChidWZmZXI6IE5vZGVCdWZmZXIsIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgcG9zaXRpb246IG51bWJlciwgY2I6IChlcnI6IEFwaUVycm9yLCBieXRlc1JlYWQ/OiBudW1iZXIsIGJ1ZmZlcj86IE5vZGVCdWZmZXIpID0+IHZvaWQpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqQ29yZSoqOiBSZWFkIGRhdGEgZnJvbSB0aGUgZmlsZS5cclxuICAgKiBAcGFyYW0gW0Jyb3dzZXJGUy5ub2RlLkJ1ZmZlcl0gYnVmZmVyIFRoZSBidWZmZXIgdGhhdCB0aGUgZGF0YSB3aWxsIGJlXHJcbiAgICogICB3cml0dGVuIHRvLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBvZmZzZXQgVGhlIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlciB3aGVyZSB3cml0aW5nIHdpbGxcclxuICAgKiAgIHN0YXJ0LlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5ndGggQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gcmVhZC5cclxuICAgKiBAcGFyYW0gW051bWJlcl0gcG9zaXRpb24gQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHdoZXJlIHRvIGJlZ2luIHJlYWRpbmcgZnJvbVxyXG4gICAqICAgaW4gdGhlIGZpbGUuIElmIHBvc2l0aW9uIGlzIG51bGwsIGRhdGEgd2lsbCBiZSByZWFkIGZyb20gdGhlIGN1cnJlbnQgZmlsZVxyXG4gICAqICAgcG9zaXRpb24uXHJcbiAgICogQHJldHVybiBbTnVtYmVyXVxyXG4gICAqL1xyXG4gIHJlYWRTeW5jKGJ1ZmZlcjogTm9kZUJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBwb3NpdGlvbjogbnVtYmVyKTogbnVtYmVyO1xyXG4gIC8qKlxyXG4gICAqICoqU3VwcGxlbWVudGFyeSoqOiBBc3luY2hyb25vdXMgYGRhdGFzeW5jYC5cclxuICAgKlxyXG4gICAqIERlZmF1bHQgaW1wbGVtZW50YXRpb24gbWFwcyB0byBgc3luY2AuXHJcbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IpXSBjYlxyXG4gICAqL1xyXG4gIGRhdGFzeW5jKGNiOiAoZT86IEFwaUVycm9yKSA9PiB2b2lkKTogdm9pZDtcclxuICAvKipcclxuICAgKiAqKlN1cHBsZW1lbnRhcnkqKjogU3luY2hyb25vdXMgYGRhdGFzeW5jYC5cclxuICAgKlxyXG4gICAqIERlZmF1bHQgaW1wbGVtZW50YXRpb24gbWFwcyB0byBgc3luY1N5bmNgLlxyXG4gICAqL1xyXG4gIGRhdGFzeW5jU3luYygpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqT3B0aW9uYWwqKjogQXN5bmNocm9ub3VzIGBjaG93bmAuXHJcbiAgICogQHBhcmFtIFtOdW1iZXJdIHVpZFxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBnaWRcclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXHJcbiAgICovXHJcbiAgY2hvd24odWlkOiBudW1iZXIsIGdpZDogbnVtYmVyLCBjYjogKGU/OiBBcGlFcnJvcikgPT4gdm9pZCk6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipPcHRpb25hbCoqOiBTeW5jaHJvbm91cyBgY2hvd25gLlxyXG4gICAqIEBwYXJhbSBbTnVtYmVyXSB1aWRcclxuICAgKiBAcGFyYW0gW051bWJlcl0gZ2lkXHJcbiAgICovXHJcbiAgY2hvd25TeW5jKHVpZDogbnVtYmVyLCBnaWQ6IG51bWJlcik6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipPcHRpb25hbCoqOiBBc3luY2hyb25vdXMgYGZjaG1vZGAuXHJcbiAgICogQHBhcmFtIFtOdW1iZXJdIG1vZGVcclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXHJcbiAgICovXHJcbiAgY2htb2QobW9kZTogbnVtYmVyLCBjYjogKGU/OiBBcGlFcnJvcikgPT4gdm9pZCk6IHZvaWQ7XHJcbiAgLyoqXHJcbiAgICogKipPcHRpb25hbCoqOiBTeW5jaHJvbm91cyBgZmNobW9kYC5cclxuICAgKiBAcGFyYW0gW051bWJlcl0gbW9kZVxyXG4gICAqL1xyXG4gIGNobW9kU3luYyhtb2RlOiBudW1iZXIpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqT3B0aW9uYWwqKjogQ2hhbmdlIHRoZSBmaWxlIHRpbWVzdGFtcHMgb2YgdGhlIGZpbGUuXHJcbiAgICogQHBhcmFtIFtEYXRlXSBhdGltZVxyXG4gICAqIEBwYXJhbSBbRGF0ZV0gbXRpbWVcclxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXHJcbiAgICovXHJcbiAgdXRpbWVzKGF0aW1lOiBEYXRlLCBtdGltZTogRGF0ZSwgY2I6IChlPzogQXBpRXJyb3IpID0+IHZvaWQpOiB2b2lkO1xyXG4gIC8qKlxyXG4gICAqICoqT3B0aW9uYWwqKjogQ2hhbmdlIHRoZSBmaWxlIHRpbWVzdGFtcHMgb2YgdGhlIGZpbGUuXHJcbiAgICogQHBhcmFtIFtEYXRlXSBhdGltZVxyXG4gICAqIEBwYXJhbSBbRGF0ZV0gbXRpbWVcclxuICAgKi9cclxuICB1dGltZXNTeW5jKGF0aW1lOiBEYXRlLCBtdGltZTogRGF0ZSk6IHZvaWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCYXNlIGNsYXNzIHRoYXQgY29udGFpbnMgc2hhcmVkIGltcGxlbWVudGF0aW9ucyBvZiBmdW5jdGlvbnMgZm9yIHRoZSBmaWxlXHJcbiAqIG9iamVjdC5cclxuICogQGNsYXNzXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQmFzZUZpbGUge1xyXG4gIHB1YmxpYyBzeW5jKGNiOiAoZT86IEFwaUVycm9yKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICBjYihuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApKTtcclxuICB9XHJcbiAgcHVibGljIHN5bmNTeW5jKCk6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKTtcclxuICB9XHJcbiAgcHVibGljIGRhdGFzeW5jKGNiOiAoZT86IEFwaUVycm9yKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICB0aGlzLnN5bmMoY2IpO1xyXG4gIH1cclxuICBwdWJsaWMgZGF0YXN5bmNTeW5jKCk6IHZvaWQge1xyXG4gICAgcmV0dXJuIHRoaXMuc3luY1N5bmMoKTtcclxuICB9XHJcbiAgcHVibGljIGNob3duKHVpZDogbnVtYmVyLCBnaWQ6IG51bWJlciwgY2I6IChlPzogQXBpRXJyb3IpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIGNiKG5ldyBBcGlFcnJvcihFcnJvckNvZGUuRU5PVFNVUCkpO1xyXG4gIH1cclxuICBwdWJsaWMgY2hvd25TeW5jKHVpZDogbnVtYmVyLCBnaWQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKTtcclxuICB9XHJcbiAgcHVibGljIGNobW9kKG1vZGU6IG51bWJlciwgY2I6IChlPzogQXBpRXJyb3IpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIGNiKG5ldyBBcGlFcnJvcihFcnJvckNvZGUuRU5PVFNVUCkpO1xyXG4gIH1cclxuICBwdWJsaWMgY2htb2RTeW5jKG1vZGU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKTtcclxuICB9XHJcbiAgcHVibGljIHV0aW1lcyhhdGltZTogRGF0ZSwgbXRpbWU6IERhdGUsIGNiOiAoZT86IEFwaUVycm9yKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICBjYihuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApKTtcclxuICB9XHJcbiAgcHVibGljIHV0aW1lc1N5bmMoYXRpbWU6IERhdGUsIG10aW1lOiBEYXRlKTogdm9pZCB7XHJcbiAgICB0aHJvdyBuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApO1xyXG4gIH1cclxufVxyXG4iXX0=
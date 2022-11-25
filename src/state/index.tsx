import { observable, action, makeObservable } from "mobx";

export interface IloadingState {
    message: string,
    state: boolean,
    type:string
}

class LoadingStore {
    constructor() {
        makeObservable(this);
    }

    @observable loadState: IloadingState = {
        message: "loading",
        state: false,
        type:"success"// "success","error","loadig"
    };

    @action changeLoad = (message: string, state: boolean,type:string) => {
        this.loadState={
            message,
            state,
            type
        }
    }

}

const loadingStore = new LoadingStore();
export default loadingStore;
import { useEffect} from 'react'
import { LoadingOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import loadingStore from '../../state';

import { observer } from 'mobx-react-lite';
import './index.css'


const LoadingBox = observer(() => {

    useEffect(() => {

        if (loadingStore.loadState.type == "success" || loadingStore.loadState.type == "error") {
            setTimeout(() => {
                loadingStore.changeLoad("", false, "loading")
            }, 5000);
        }

    }, [loadingStore.loadState.type])
    const getIcon = (data: string) => {
        // "success","error","loadig"
        let icon;
        if (data == "success") {
            icon = <CheckOutlined style={{ fontSize: 24 }} />
        } else if (data == "error") {
            icon = <CloseOutlined style={{ fontSize: 24 }} />
        } else {
            icon = <LoadingOutlined style={{ fontSize: 24 }} spin />
        }

        return <Spin indicator={icon} />

    }

    return (
        <>
            {
                loadingStore.loadState.state ? <div className='loading-box'>
                    <div>
                        {
                            getIcon(loadingStore.loadState.type)
                        }
                    </div>
                    <p>{loadingStore.loadState.message}</p>
                </div> : <></>
            }
        </>
    )
})

export default LoadingBox;

import { error } from '@sveltejs/kit';
import { APIRequest } from '../../../../../utils/request.js'
import { PUBLIC_BASE_URL } from '$env/static/public';


export async function load({ params }) {


    const data = await APIRequest({
      url: `${PUBLIC_BASE_URL}/${params.space}/${params.room}/post/${params.post}`,
      method: 'GET',
    })

    if (data) {
        return data;
    }

    throw error(404, 'Not found');
}

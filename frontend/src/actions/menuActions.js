import { BASE_URL } from "../utils/api";

export const getMenus = (id) => async (dispatch) => {
    try {
        dispatch({ type: "GET_MENU_REQUEST" });

        const response = await fetch(`${BASE_URL}/eats/stores/${id}/menus`);
        const data = await response.json();

        dispatch({
            type: "GET_MENU_SUCCESS",
            payload: data.menus,
        });
    } catch (error) {
        dispatch({
            type: "GET_MENU_FAIL",
            payload: error.message,
        });
    }
};
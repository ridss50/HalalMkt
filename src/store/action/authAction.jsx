import * as actionTypes from "../actionTypes/authActionType";
import { auth, db } from "../../utility/firebase";
import AsyncStorage from "@react-native-community/async-storage";

const storeData = async (e, p, t, callback) => {
  try {
    const data = {
      loggedIn: e === "" || p === "" || t === "" ? false : true,
      email: e,
      password: p,
      userType: t
    };
    await AsyncStorage.setItem("userData", JSON.stringify(data));
    callback();
  } catch (e) {
    // saving error
    console.log("error store", e);
  }
};

export const signInAction = (email, password, callback) => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });

    if (email && password) {
      auth
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          db
            .collection("User")
            .where("Email", "==", email)
            .get()
            .then(result => {
              result.docChanges().map(user => {
                const u = user.doc.data().Type;

                if (u === "user") {
                  dispatch({
                    type: actionTypes.AUTH_SIGNIN,
                    email: user.doc.data().Email,
                    name: user.doc.data().Name,
                    phone: user.doc.data().PhoneNumber,
                    address: user.doc.data().Address,
                    userType: u
                  });
                }
                if (u === "vendor") {
                  dispatch({
                    type: actionTypes.AUTH_VENDOR_SIGNIN,
                    email: user.doc.data().Email,
                    name: user.doc.data().Name,
                    phone: user.doc.data().PhoneNumber,
                    address: user.doc.data().Address,
                    storeName: user.doc.data().StoreName,
                    userType: u,
                    IsActive: user.doc.data().IsActive,
                    StockType: user.doc.data().StockType
                  });
                }
                // setUserT(result.docChanges()[0].doc.data().type);
                storeData(email, password, u, callback);
                dispatch({ type: actionTypes.START_LOADING, payload: false });
              });
            })
            .catch(error => {
              console.log("Error", error);
              dispatch({
                type: actionTypes.AUTH_ERROR,
                payload: "Something went wrong!"
              });
              storeData("", "", "", () => {});
            });
        })
        .catch(e => {
          console.log("Error out", e);
          if (e.code === "auth/user-not-found") {
            dispatch({
              type: actionTypes.AUTH_ERROR,
              payload: "User not found!"
            });
          } else if (e.code === "auth/wrong-password") {
            dispatch({
              type: actionTypes.AUTH_ERROR,
              payload: "Enter correct password!"
            });
          } else {
            dispatch({
              type: actionTypes.AUTH_ERROR,
              payload: "Something went wrong!"
            });
          }

          storeData("", "", "", () => {});
        });
    }
  };
};

export const signUpAction = (email, password, name, phone, address, nav) => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });
    auth
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        // dispatch({ type: LOADER_AUTH ,payload:false });
        db
          .collection("User")
          .doc()
          .set({
            Address: address,
            Email: email,
            IsActive: 1,
            Name: name,
            PhoneNumber: phone,
            Type: "user"
          })
          .then(() => {
            // dispatch({
            //   type: actionTypes.AUTH_REGISTER,
            //   email: email,
            //   name: name,
            //   phone: phone,
            //   address: address,
            //   userType: "user"
            // });

            // storeData(email, password, () => console.log("data stored"));
            dispatch({ type: actionTypes.START_LOADING, payload: false });
            nav.goBack();
          })
          .catch(error => {
            console.log("Error", error);
            dispatch({ type: actionTypes.AUTH_ERROR, payload: error.message });
            dispatch({ type: actionTypes.START_LOADING, payload: false });
            storeData("", "", "", () => {});
          });
      })
      .catch(error => {
        console.log("Error", error);
        dispatch({ type: actionTypes.AUTH_ERROR, payload: error.message });
        dispatch({ type: actionTypes.START_LOADING, payload: false });
        storeData("", "", "", () => {});
      });
  };
};

export const profileUpdate = (email, name, phone, address) => {
  console.log("Profile Update");

  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });

    db
      .collection("User")
      .where("Email", "==", email)
      .get()
      .then(result => {
        // const list = result.docChanges().map(result => result.doc.data());
        const id = result.docChanges().map(d => d.doc.id);
        console.log("response data", id);

        console.log("Data", email, name, phone, address);
        db
          .collection("User")
          .doc(id.toString())
          .update({
            Name: name,
            PhoneNumber: phone,
            Address: address
          })
          .then(() => {
            console.log("User Updated");
            dispatch({
              type: actionTypes.AUTH_PROFILE_UPDATE,
              name: name,
              phone: phone,
              address: address
            });
            dispatch({ type: actionTypes.START_LOADING, payload: false });
          })
          .catch(error => {
            console.log("Error", error);
            dispatch({ type: actionTypes.START_LOADING, payload: false });
            dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
          });
      })
      .catch(error => {
        console.log("Error", error);
        dispatch({ type: actionTypes.START_LOADING, payload: false });
        dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
      });
  };
};

export const updateServerPassword = (newPassword, uType, callback) => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });
    auth.currentUser.updatePassword(newPassword).then(() => {
      storeData(auth.currentUser.email, uType, newPassword, () =>
        console.log("Password Updated")
      );
      dispatch({ type: actionTypes.START_LOADING, payload: false });
      callback();
    });
  };
};

export const vendorProfileUpdate = (email, name, storenm, phone, address) => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });

    db
      .collection("User")
      .where("Email", "==", email)
      .get()
      .then(result => {
        // const list = result.docChanges().map(result => result.doc.data());
        const id = result.docChanges().map(d => d.doc.id);
        db
          .collection("User")
          .doc(id)
          .update({
            Name: name,
            PhoneNumber: phone,
            Address: address,
            StoreName: storenm
          })
          .then(() => {
            dispatch({
              type: actionTypes.AUTH_PROFILE_UPDATE,
              name: name,
              phone: phone,
              address: address,
              storeName: storenm
            });
          })
          .catch(error => {
            console.log("Error", error);
            dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
          });
      })
      .catch(error => {
        console.log("Error", error);
        dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
      });
  };
};

export const switchIsActiveStatus = (vEmail, status) => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });
    db.collection("User").where("Email", "==", vEmail).get().then(result => {
      const id = result.docChanges().map(d => d.doc.id);
      db
        .collection("User")
        .doc(id.toString())
        .update({
          IsActive: status === true ? 1 : 0
        })
        .then(() => {
          dispatch({
            type: actionTypes.BUSINESS_ACTIVE_STATUS,
            payload: status === true ? 1 : 0
          });
        })
        .catch(error => {
          console.log("Error", error);
          dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
        });
    });
  };
};

export const signOutAction = () => {
  return dispatch => {
    dispatch({ type: actionTypes.START_LOADING, payload: true });
    dispatch({ type: actionTypes.AUTH_SIGNOUT });
    auth.signOut().catch(error => {
      console.log("Error", error);
      dispatch({ type: actionTypes.AUTH_ERROR, payload: error });
    });
    AsyncStorage.removeItem("userData");
    dispatch({ type: actionTypes.START_LOADING, payload: false });
  };
};

export const clearState = () => {
  return dispatch => {
    dispatch({ type: actionTypes.AUTH_CLEAR_STATE });
  };
};

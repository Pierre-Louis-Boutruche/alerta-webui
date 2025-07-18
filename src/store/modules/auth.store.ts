import AuthApi from '@/services/api/auth.service'
import CasApi from '@/services/api/cas.service'

export function makeStore(vueAuth) {
  return {
    namespaced: true,

    state: {
      isAuthenticated: vueAuth.isAuthenticated(),
      token: vueAuth.getToken(),
      payload: vueAuth.getPayload(),

      isSending: false
    },

    mutations: {
      SET_AUTH(state, [token, payload]) {
        state.isAuthenticated = true
        state.token = token
        state.payload = payload
      },
      RESET_AUTH(state) {
        state.isAuthenticated = false
        state.token = null
        state.payload = {}
      },
      SET_SENDING(state) {
        state.isSending = true
      },
      RESET_SENDING(state) {
        state.isSending = false
      }
    },

    actions: {
      signup({commit, dispatch}, {name, email, password, text}) {
        commit('SET_SENDING')
        return vueAuth
          .register({
            name,
            email,
            password,
            text
          })
          .then(() => commit('SET_AUTH', [vueAuth.getToken(), vueAuth.getPayload()]))
          .then(() => dispatch('getUserPrefs', {}, {root: true}))
          .finally(() => commit('RESET_SENDING'))
      },
      login({commit, dispatch}, credentials) {
        return vueAuth
          .login(credentials)
          .then(() => commit('SET_AUTH', [vueAuth.getToken(), vueAuth.getPayload()]))
          .then(() => dispatch('getUserPrefs', {}, {root: true}))
          .catch(error => {
            throw error
          })
      },
      casAuthenticate({commit, dispatch}, {ticket, service}) {
        return CasApi.authenticate(ticket, service)
          .then(token => {
            vueAuth.setToken(token)
            commit('SET_AUTH', [vueAuth.getToken(), vueAuth.getPayload()])
          })
          .then(() => dispatch('getUserPrefs', {}, {root: true}))
          .catch(error => {
            throw error
          })
      },
      authenticate({commit, dispatch}, provider) {
        return vueAuth
          .authenticate(provider)
          .then(() => commit('SET_AUTH', [vueAuth.getToken(), vueAuth.getPayload()]))
          .then(() => dispatch('getUserPrefs', {}, {root: true}))
          .catch(error => {
            throw error
          })
      },
      setToken({commit, dispatch}, token) {
        vueAuth.setToken(token)
        commit('SET_AUTH', [token, vueAuth.getPayload()])
        dispatch('getUserPrefs', {}, {root: true})
      },
      confirm({commit}, token) {
        return AuthApi.confirm(token)
      },
      forgot({commit}, email) {
        commit('SET_SENDING')
        return AuthApi.forgot(email).finally(() => commit('RESET_SENDING'))
      },
      reset({commit}, [token, password]) {
        return AuthApi.reset(token, password)
      },
      logout({commit}) {
        return vueAuth
          .logout()
          .then(response => {
            return response
          })
          .finally(() => commit('RESET_AUTH'))
      }
    },

    getters: {
      getOptions() {
        return vueAuth.options
      },
      getPayload(state) {
        return state.payload
      },
      isLoggedIn(state) {
        return state.isAuthenticated
      },
      getUsername(state) {
        return state.payload && state.payload.preferred_username
      },
      getAvatar(state) {
        return state.payload && state.payload.picture
      },
      scopes(state) {
        return state.payload && state.payload.scope ? state.payload.scope.split(' ') : []
      },
      customers(state) {
        return state.payload.customers && state.payload.customers.length == 0 ? ['ALL (*)'] : state.payload.customers
      },
      isAdmin(state, getters) {
        if (getters.isLoggedIn) {
          return getters.scopes.includes('admin')
        }
        return false
      }
    }
  }
}
